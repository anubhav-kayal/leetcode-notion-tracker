import { toNotionLanguage } from './language-map'
import { NotionAuthError, NotionNotFoundError } from './types'
import type { Submission, ProblemRecord } from './types'

const NOTION_VERSION = '2022-06-28'

interface NotionText {
  type: 'text'
  text: { content: string }
}

interface NotionRichText {
  rich_text: NotionText[]
}

interface NotionTitle {
  title: NotionText[]
}

interface NotionSelect {
  select: { name: string } | null
}

interface NotionUrl {
  url: string
}

interface NotionNumber {
  number: number
}

interface NotionDate {
  date: { start: string } | null
}

interface NotionProperties {
  Name: NotionTitle
  Slug: NotionRichText
  Difficulty: NotionSelect
  Status: NotionSelect
  URL: NotionUrl
  'Last Attempted': NotionDate
  'Attempt Count': NotionNumber
}

const DIFFICULTY_MAP: Record<string, string> = {
  Easy: 'Easy',
  Medium: 'Medium',
  Hard: 'Hard',
}

function toDateString(ts: number): string {
  return new Date(ts).toISOString().split('T')[0]
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

async function notionFetch(
  url: string,
  apiKey: string,
  body: Record<string, unknown>
): Promise<Response> {
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(body),
  })

  if (res.status === 401) throw new NotionAuthError()
  if (res.status === 404) throw new NotionNotFoundError()
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Notion API error ${res.status}: ${JSON.stringify(err)}`)
  }

  return res
}

export async function findProblemBySlug(
  apiKey: string,
  databaseId: string,
  slug: string
): Promise<{ pageId: string; properties: NotionProperties } | null> {
  const res = await notionFetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    apiKey,
    {
      filter: {
        property: 'Slug',
        rich_text: { equals: slug },
      },
      page_size: 1,
    }
  )

  const body = await res.json()
  const results: Array<{ id: string; properties: NotionProperties }> = body.results ?? []

  if (results.length === 0) return null

  return { pageId: results[0].id, properties: results[0].properties }
}

function buildProperties(
  submission: Submission,
  attemptCount: number
): NotionProperties {
  return {
    Name: { title: [{ type: 'text', text: { content: submission.problemTitle } }] },
    Slug: { rich_text: [{ type: 'text', text: { content: submission.problemSlug } }] },
    Difficulty: { select: { name: DIFFICULTY_MAP[submission.difficulty] ?? 'Medium' } },
    Status: {
      select: {
        name: submission.result === 'Accepted' ? 'Solved' : 'Attempted',
      },
    },
    URL: { url: submission.leetcodeUrl },
    'Last Attempted': { date: { start: toDateString(submission.timestamp) } },
    'Attempt Count': { number: attemptCount },
  }
}

export async function createProblemPage(
  apiKey: string,
  databaseId: string,
  submission: Submission
): Promise<{ pageId: string; pageUrl: string }> {
  const notionLanguage = toNotionLanguage(submission.language)

  const res = await notionFetch('https://api.notion.com/v1/pages', apiKey, {
    parent: { database_id: databaseId },
    properties: buildProperties(submission, 1),
    children: [
      {
        object: 'block',
        type: 'code',
        code: {
          language: notionLanguage,
          rich_text: [{ type: 'text', text: { content: submission.code || ' ' } }],
        },
      },
    ],
  })

  const body = await res.json()
  return { pageId: body.id, pageUrl: body.url ?? '' }
}

export async function updateProblemPage(
  apiKey: string,
  pageId: string,
  submission: Submission,
  currentProperties: NotionProperties,
  attemptCount: number
): Promise<void> {
  const notionLanguage = toNotionLanguage(submission.language)
  const isAccepted = submission.result === 'Accepted'
  const wasSolved = currentProperties.Status.select?.name === 'Solved'
  const newStatus = isAccepted && !wasSolved ? 'Solved' : (currentProperties.Status.select?.name ?? 'Attempted')

  await notionFetch(`https://api.notion.com/v1/pages/${pageId}`, apiKey, {
    properties: {
      Status: { select: { name: newStatus } },
      'Attempt Count': { number: attemptCount },
      'Last Attempted': { date: { start: toDateString(submission.timestamp) } },
    },
  })

  const childrenRes = await notionFetch(
    `https://api.notion.com/v1/blocks/${pageId}/children`,
    apiKey,
    {
      children: [
        {
          object: 'block',
          type: 'code',
          code: {
            language: notionLanguage,
            rich_text: [{ type: 'text', text: { content: submission.code || ' ' } }],
          },
        },
      ],
    }
  )

  await childrenRes.json()
}

export async function syncSubmission(
  apiKey: string,
  databaseId: string,
  submission: Submission,
  existingProblem?: ProblemRecord
): Promise<{ pageId: string; pageUrl: string }> {
  if (existingProblem) {
    const found = await findProblemBySlug(apiKey, databaseId, submission.problemSlug)
    if (found) {
      const attemptCount = existingProblem.attemptCount + 1
      await updateProblemPage(apiKey, found.pageId, submission, found.properties, attemptCount)
      return { pageId: found.pageId, pageUrl: existingProblem.notionPageUrl }
    }
  }

  const result = await createProblemPage(apiKey, databaseId, submission)
  return result
}

export async function queryDatabaseProblems(
  apiKey: string,
  databaseId: string
): Promise<Array<{ pageId: string; properties: NotionProperties }>> {
  const results: Array<{ pageId: string; properties: NotionProperties }> = []
  let cursor: string | null = null

  for (let i = 0; i < 10; i++) {
    const body: Record<string, unknown> = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const res = await notionFetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      apiKey,
      body
    )

    const data = await res.json()
    for (const item of data.results ?? []) {
      results.push({ pageId: item.id, properties: item.properties })
    }

    if (!data.has_more) break
    cursor = data.next_cursor
  }

  return results
}
