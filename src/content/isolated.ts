console.log('LeetTrack: isolated content script injected at', document.readyState)

const sentIds = new Set<string>()

function generateDedupId(problemSlug: string, timestamp: number): string {
  const rounded = Math.round(timestamp / 5000) * 5000
  return `${problemSlug}-${rounded}`
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

type SubmissionResult =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Runtime Error'
  | 'Compile Error'

type Difficulty = 'Easy' | 'Medium' | 'Hard'

interface ParsedSubmission {
  result: SubmissionResult
  language: string
  runtime: string
  memory: string
  code: string
}

interface ScrapedProblem {
  title: string
  slug: string
  difficulty: Difficulty
}

function scrapeProblemInfo(): ScrapedProblem | null {
  try {
    const pathParts = window.location.pathname.split('/')
    const slugIdx = pathParts.indexOf('problems')
    const slug = slugIdx >= 0 ? pathParts[slugIdx + 1] || '' : ''

    let title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    const selectors = [
      '[data-cy="question-title"]',
      '.css-v3d350',
      '.mr-2.text-label-1',
      'div[class*="title"]',
    ]
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (el?.textContent?.trim()) {
        title = el.textContent.trim()
        break
      }
    }

    let difficulty: Difficulty = 'Medium'
    const diffEl = document.querySelector('[diff]')
    if (diffEl) {
      const d = diffEl.getAttribute('diff')
      if (d === 'Easy' || d === 'Medium' || d === 'Hard') {
        difficulty = d as Difficulty
      }
    } else {
      const candidates = document.querySelectorAll('span, div')
      for (const el of candidates) {
        const text = el.textContent?.trim()
        if (text === 'Easy' || text === 'Medium' || text === 'Hard') {
          const parent = el.closest('[class*="diff"], [class*="difficulty"]')
          if (parent) {
            difficulty = text as Difficulty
            break
          }
        }
      }
    }

    return { title, slug, difficulty }
  } catch {
    return null
  }
}

function buildAndSendSubmission(parsed: ParsedSubmission, problem: ScrapedProblem): void {
  const ts = Date.now()
  const dedupId = generateDedupId(problem.slug, ts)

  if (sentIds.has(dedupId)) return
  sentIds.add(dedupId)

  console.log('LeetTrack: sending SUBMISSION message', { problem: problem.slug, result: parsed.result })
  chrome.runtime.sendMessage({
    type: 'SUBMISSION',
    data: {
      id: generateUUID(),
      problemSlug: problem.slug,
      problemTitle: problem.title,
      difficulty: problem.difficulty,
      result: parsed.result,
      language: parsed.language,
      code: parsed.code,
      runtime: parsed.runtime,
      memory: parsed.memory,
      timestamp: ts,
      leetcodeUrl: `https://leetcode.com/problems/${problem.slug}/`,
      synced: false,
    },
  }).catch((err) => {
    console.error('LeetTrack: sendMessage failed', err)
  })
}

// Listen for messages from the MAIN world script (fetch interceptor)
window.addEventListener('message', (event) => {
  if (event.data?.type === 'LEETTRACK_FETCH_SUBMISSION') {
    const parsed = event.data.data as ParsedSubmission
    const problem = scrapeProblemInfo()
    if (problem) buildAndSendSubmission(parsed, problem)
  }
})

let lastMutationSent = 0
const observer = new MutationObserver(() => {
  const resultTexts = ['Accepted', 'Wrong Answer', 'Time Limit Exceeded']
  const elements = document.querySelectorAll('[class*="result"], [class*="submission"]')

  for (const el of elements) {
    const text = el.textContent?.trim() || ''
    if (resultTexts.some(r => text.includes(r))) {
      const now = Date.now()
      if (now - lastMutationSent < 5000) return
      lastMutationSent = now

      setTimeout(() => {
        const problem = scrapeProblemInfo()
        if (!problem) return

        const dedupId = generateDedupId(problem.slug, now)
        if (sentIds.has(dedupId)) return
        sentIds.add(dedupId)

        console.log('LeetTrack: MutationObserver triggered, sending SUBMISSION', { problem: problem.slug })
        chrome.runtime.sendMessage({
          type: 'SUBMISSION',
          data: {
            id: generateUUID(),
            problemSlug: problem.slug,
            problemTitle: problem.title,
            difficulty: problem.difficulty,
            result: 'Accepted' as SubmissionResult,
            language: '',
            code: '',
            runtime: '',
            memory: '',
            timestamp: now,
            leetcodeUrl: `https://leetcode.com/problems/${problem.slug}/`,
            synced: false,
          },
        }).catch((err) => {
          console.error('LeetTrack: MutationObserver sendMessage failed', err)
        })
      }, 2000)
      break
    }
  }
})

function startObserver() {
  if (document.body) {
    console.log('LeetTrack: starting MutationObserver')
    observer.observe(document.body, { childList: true, subtree: true })
  } else {
    requestAnimationFrame(startObserver)
  }
}

startObserver()
