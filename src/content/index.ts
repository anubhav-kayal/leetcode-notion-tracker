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

function extractFromResponse(data: Record<string, unknown>): ParsedSubmission | null {
  if (!data || typeof data.status_msg !== 'string') return null

  const resultMap: Record<string, SubmissionResult> = {
    Accepted: 'Accepted',
    'Wrong Answer': 'Wrong Answer',
    'Time Limit Exceeded': 'Time Limit Exceeded',
    'Memory Limit Exceeded': 'Memory Limit Exceeded',
    'Runtime Error': 'Runtime Error',
    'Compile Error': 'Compile Error',
  }

  const status = data.status_msg as string
  const result = resultMap[status]
  if (!result) return null

  return {
    result,
    language: (data.lang as string) || '',
    runtime: (data.runtime as string) || '',
    memory: (data.memory as string) || '',
    code: '',
  }
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
        difficulty = d
      }
    } else {
      const candidates = document.querySelectorAll('span, div')
      for (const el of candidates) {
        const text = el.textContent?.trim()
        if (text === 'Easy' || text === 'Medium' || text === 'Hard') {
          const parent = el.closest('[class*="diff"], [class*="difficulty"]')
          if (parent) {
            difficulty = text
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

function buildAndSendSubmission(
  parsed: ParsedSubmission,
  problem: ScrapedProblem
): void {
  const ts = Date.now()
  const dedupId = generateDedupId(problem.slug, ts)

  if (sentIds.has(dedupId)) return
  sentIds.add(dedupId)

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
  }).catch(() => {})
}

const originalFetch = window.fetch.bind(window)
window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
  const response = await originalFetch(...args)
  const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url

  try {
    if (url.includes('/submit/')) {
      const clone = response.clone()
      clone.json().then(data => {
        const parsed = extractFromResponse(data as Record<string, unknown>)
        if (!parsed) return

        const body = args[1] ? (args[1] as RequestInit).body : null
        if (typeof body === 'string') {
          try {
            const parsedBody = JSON.parse(body)
            parsed.code = parsedBody.code || ''
          } catch {
            parsed.code = body
          }
        }

        const problem = scrapeProblemInfo()
        if (problem) buildAndSendSubmission(parsed, problem)
      }).catch(() => {})
    }

    if (url.includes('/graphql')) {
      const body = args[1] ? (args[1] as RequestInit).body : null
      if (typeof body === 'string') {
        try {
          const parsedBody = JSON.parse(body)
          if (parsedBody.operationName === 'submitSolution') {
            const responseClone = response.clone()
            responseClone.json().then(data => {
              const parsed = extractFromResponse(data as Record<string, unknown>)
              if (!parsed) return
              parsed.code = parsedBody.variables?.code || ''

              const problem = scrapeProblemInfo()
              if (problem) buildAndSendSubmission(parsed, problem)
            }).catch(() => {})
          }
        } catch { /* not JSON or not our query */ }
      }
    }
  } catch { /* silent */ }

  return response
}

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
        }).catch(() => {})
      }, 2000)
      break
    }
  }
})

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true })
} else {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true })
  })
}
