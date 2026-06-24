import type { Submission, ProblemRecord } from './types'

export interface InsightResult {
  text: string
  generatedAt: number
}

interface InsightRequest {
  submissions: Submission[]
  problems: ProblemRecord[]
  streak: number
  totalSolved: number
}

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `You are a LeetCode coach analyzing a developer's submission history.
Provide a concise, actionable insight (2-3 sentences) about:
1. Their overall progress and consistency
2. Areas for improvement (specific patterns you notice)
3. One specific recommendation for tomorrow

Be encouraging but honest. Focus on patterns in difficulty, frequency, and results.`

function buildPrompt(data: InsightRequest): string {
  const unsolved = Object.values(data.problems).filter(p => p.status === 'Attempted')
  const solved = Object.values(data.problems).filter(p => p.status === 'Solved')
  const difficulties = Object.values(data.problems).map(p => p.difficulty)
  const easy = difficulties.filter(d => d === 'Easy').length
  const medium = difficulties.filter(d => d === 'Medium').length
  const hard = difficulties.filter(d => d === 'Hard').length

  return [
    `Analyze this LeetCode journey:`,
    `- Total submissions: ${data.submissions.length}`,
    `- Problems attempted: ${Object.keys(data.problems).length}`,
    `- Problems solved: ${solved.length}`,
    `- Unsolved: ${unsolved.length}`,
    `- Difficulty breakdown: ${easy} Easy / ${medium} Medium / ${hard} Hard`,
    `- Current streak: ${data.streak} days`,
    `- Total solved count: ${data.totalSolved}`,
    ``,
    `Submissions (last 10):`,
    ...data.submissions.slice(-10).map(s =>
      `  ${s.problemTitle} (${s.difficulty}) — ${s.result} [${s.language}]`
    ),
    ``,
    `Provide a brief, actionable insight.`,
  ].join('\n')
}

function buildInsightPrompt(submissions: Submission[], problems: Record<string, ProblemRecord>): string {
  const totalSubmissions = submissions.length
  const uniqueProblems = Object.keys(problems).length
  const solved = Object.values(problems).filter(p => p.status === 'Solved').length
  const diffs = { Easy: 0, Medium: 0, Hard: 0 }
  const langs = new Map<string, number>()

  for (const p of Object.values(problems)) {
    diffs[p.difficulty]++
  }
  for (const s of submissions) {
    langs.set(s.language, (langs.get(s.language) || 0) + 1)
  }

  const topLang = [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l).join(', ')

  return `You are a LeetCode coach. Analyze this data and give a brief, actionable insight (2-3 sentences).

Stats:
- Total submissions: ${totalSubmissions}
- Unique problems: ${uniqueProblems}
- Solved: ${solved}
- Easy: ${diffs.Easy} | Medium: ${diffs.Medium} | Hard: ${diffs.Hard}
- Top languages: ${topLang || 'N/A'}

Focus on patterns, areas to improve, and encouragement.`
}

export async function generateInsight(
  ...args:
    | [InsightRequest, string]
    | [Submission[], Record<string, ProblemRecord>, string]
): Promise<InsightResult> {
  let apiKey: string
  let text: string

  if (args.length === 2) {
    const [data, key] = args
    apiKey = key
    if (!apiKey) {
      return { text: 'Claude API key not configured.', generatedAt: Date.now() }
    }
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(data) }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(`Claude API error ${response.status}: ${JSON.stringify(err)}`)
    }

    const body = await response.json()
    text = body.content?.[0]?.text ?? ''

    return { text, generatedAt: Date.now() }
  } else {
    const [submissions, problems, key] = args
    apiKey = key
    if (!apiKey) {
      return { text: 'Claude API key not configured.', generatedAt: Date.now() }
    }

    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [
          { role: 'user', content: buildInsightPrompt(submissions, problems) },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    text = data.content?.[0]?.text ?? 'No insight generated.'

    return { text, generatedAt: Date.now() }
  }
}

export async function generateWeeklyReport(
  submissions: Submission[],
  problems: Record<string, ProblemRecord>,
  apiKey: string
): Promise<string> {
  if (!apiKey) return 'Claude API key not configured.'

  const solved = Object.values(problems).filter(p => p.status === 'Solved').length
  const now = Date.now()
  const weekAgo = now - 7 * 86400000
  const weekSubmissions = submissions.filter(s => s.timestamp >= weekAgo)
  const weekProblems = new Set(weekSubmissions.map(s => s.problemSlug))

  const prompt = `Summarize this week's LeetCode activity (2-3 sentences):

Week stats:
- Submissions this week: ${weekSubmissions.length}
- Problems attempted: ${weekProblems.size}
- Total solved overall: ${solved}

Give a brief weekly summary with encouragement.`

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? 'No summary generated.'
}
