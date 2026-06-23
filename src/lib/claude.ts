import type { Submission, ProblemRecord } from './types'

export interface InsightResult {
  text: string
  generatedAt: number
}

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

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
  submissions: Submission[],
  problems: Record<string, ProblemRecord>,
  apiKey: string
): Promise<InsightResult> {
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
  const text = data.content?.[0]?.text ?? 'No insight generated.'

  return { text, generatedAt: Date.now() }
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
