import type { Submission, ProblemRecord, Settings, StorageData } from '../lib/types'
import { syncSubmission } from '../lib/notion'
import { NotionAuthError } from '../lib/types'

const RETRY_ALARM = 'retry-pending'
const RETRY_INTERVAL_MINUTES = 3

function getDefaultStorage(): StorageData {
  return {
    submissions: [],
    problems: {},
    streak: 0,
    lastSubmissionDate: '',
    totalSolved: 0,
    insight: null,
    pendingQueue: [],
    reviewQueue: [],
  }
}

async function getStorage(): Promise<StorageData> {
  const result = await chrome.storage.local.get('leetrackData')
  if (!result.leetrackData) return getDefaultStorage()
  return { ...getDefaultStorage(), ...result.leetrackData }
}

async function setStorage(data: StorageData): Promise<void> {
  await chrome.storage.local.set({ leetrackData: data })
}

async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get('leetrackSettings')
  const settings: Partial<Settings> = result.leetrackSettings ?? {}
  return {
    notionApiKey: settings.notionApiKey ?? '',
    notionDatabaseId: settings.notionDatabaseId ?? '',
    claudeApiKey: settings.claudeApiKey ?? '',
  }
}

function updateStreak(data: StorageData, submissionDate: string): StorageData {
  const today = submissionDate
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (data.lastSubmissionDate === today) {
    return data
  }

  if (data.lastSubmissionDate === yesterday) {
    data.streak += 1
  } else if (data.lastSubmissionDate !== today) {
    data.streak = 1
  }

  data.lastSubmissionDate = today
  return data
}

async function processSubmission(submission: Submission): Promise<void> {
  const settings = await getSettings()
  if (!settings.notionApiKey || !settings.notionDatabaseId) {
    console.warn('LeetTrack: Notion API key or database ID not configured')
    return
  }

  const data = await getStorage()

  if (data.submissions.some(s => s.id === submission.id)) {
    return
  }

  data.submissions.push(submission)

  const existingProblem = data.problems[submission.problemSlug]
  const submissionDate = new Date(submission.timestamp).toISOString().split('T')[0]

  data.pendingQueue.push(submission)

  try {
    const { pageId, pageUrl } = await syncSubmission(
      settings.notionApiKey,
      settings.notionDatabaseId,
      submission,
      existingProblem
    )

    submission.synced = true
    submission.notionPageId = pageId
    submission.notionPageUrl = pageUrl

    const record: ProblemRecord = existingProblem ?? {
      slug: submission.problemSlug,
      title: submission.problemTitle,
      difficulty: submission.difficulty,
      leetcodeUrl: submission.leetcodeUrl,
      notionPageId: pageId,
      notionPageUrl: pageUrl,
      status: 'Attempted',
      attemptCount: 0,
      lastAttempted: submission.timestamp,
    }

    record.attemptCount += 1
    record.lastAttempted = submission.timestamp

    if (submission.result === 'Accepted') {
      record.status = 'Solved'
      if (!record.firstSolved) {
        record.firstSolved = submission.timestamp
      }
    }

    if (!existingProblem) {
      data.totalSolved += 1
    }

    data.problems[submission.problemSlug] = record
    data.pendingQueue = data.pendingQueue.filter(s => s.id !== submission.id)
    updateStreak(data, submissionDate)
  } catch (err) {
    if (err instanceof NotionAuthError) {
      console.error('LeetTrack: Notion API key is invalid')
      return
    }
    console.error('LeetTrack: Failed to sync submission', err)
  }

  await setStorage(data)
}

async function retryPending(): Promise<void> {
  const settings = await getSettings()
  if (!settings.notionApiKey || !settings.notionDatabaseId) return

  const data = await getStorage()
  if (data.pendingQueue.length === 0) return

  const remaining: Submission[] = []

  for (const submission of data.pendingQueue) {
    const existingProblem = data.problems[submission.problemSlug]

    try {
      const { pageId, pageUrl } = await syncSubmission(
        settings.notionApiKey,
        settings.notionDatabaseId,
        submission,
        existingProblem
      )

      submission.synced = true
      submission.notionPageId = pageId
      submission.notionPageUrl = pageUrl

      const record: ProblemRecord = existingProblem ?? {
        slug: submission.problemSlug,
        title: submission.problemTitle,
        difficulty: submission.difficulty,
        leetcodeUrl: submission.leetcodeUrl,
        notionPageId: pageId,
        notionPageUrl: pageUrl,
        status: 'Attempted',
        attemptCount: 0,
        lastAttempted: submission.timestamp,
      }

      record.attemptCount += 1
      record.lastAttempted = submission.timestamp

      if (submission.result === 'Accepted') {
        record.status = 'Solved'
        if (!record.firstSolved) {
          record.firstSolved = submission.timestamp
        }
      }

      if (!existingProblem) {
        data.totalSolved += 1
      }

      data.problems[submission.problemSlug] = record
      updateStreak(data, new Date(submission.timestamp).toISOString().split('T')[0])
    } catch {
      remaining.push(submission)
    }
  }

  data.pendingQueue = remaining
  await setStorage(data)

  if (remaining.length > 0) {
    chrome.alarms.create(RETRY_ALARM, { delayInMinutes: RETRY_INTERVAL_MINUTES })
  }
}

chrome.runtime.onMessage.addListener((
  message: { type: string; data: Submission },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => {
  if (message.type === 'SUBMISSION') {
    processSubmission(message.data).catch(console.error)
  }
  sendResponse({ received: true })
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(RETRY_ALARM, { delayInMinutes: RETRY_INTERVAL_MINUTES })
})

chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
  if (alarm.name === RETRY_ALARM) {
    retryPending().catch(console.error)
  }
})
