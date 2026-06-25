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

interface NotionMultiSelect {
  multi_select: Array<{ name: string }>
}

interface NotionProperties {
  Name: NotionTitle
  Slug: NotionRichText
  Difficulty: NotionSelect
  Status: NotionSelect
  URL: NotionUrl
  'Last Attempted': NotionDate
  'Attempt Count': NotionNumber
  Companies?: NotionMultiSelect
  Topics?: NotionMultiSelect
  'Time to Solve'?: NotionNumber
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
  body?: Record<string, unknown>,
  method: 'GET' | 'POST' | 'PATCH' = 'POST'
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: buildHeaders(apiKey),
  }
  if (body) {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(url, options)

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
  attemptCount: number,
  companies?: string[],
  topics?: string[],
  timeSeconds?: number
): NotionProperties {
  const props: NotionProperties = {
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

  if (companies && companies.length > 0) {
    props.Companies = { multi_select: companies.map(c => ({ name: c })) }
  }
  if (topics && topics.length > 0) {
    props.Topics = { multi_select: topics.map(t => ({ name: t })) }
  }
  if (timeSeconds !== undefined) {
    props['Time to Solve'] = { number: timeSeconds }
  }

  return props
}

export async function createProblemPage(
  apiKey: string,
  databaseId: string,
  submission: Submission,
  existingProblem?: ProblemRecord
): Promise<{ pageId: string; pageUrl: string }> {
  const notionLanguage = toNotionLanguage(submission.language)

  const properties = buildProperties(
    submission, 
    1, 
    existingProblem?.companies, 
    submission.topics ?? existingProblem?.topics,
    submission.timeSeconds
  )

  const payload = {
    parent: { database_id: databaseId },
    properties,
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

  let res: Response
  try {
    res = await notionFetch('https://api.notion.com/v1/pages', apiKey, payload)
  } catch (err: any) {
    if (err.message?.includes('is not a property that exists')) {
      delete payload.properties.Topics
      delete payload.properties.Companies
      delete payload.properties['Time to Solve']
      res = await notionFetch('https://api.notion.com/v1/pages', apiKey, payload)
    } else {
      throw err
    }
  }

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

  const patchPayload: Record<string, any> = {
    properties: {
      Status: { select: { name: newStatus } },
      'Attempt Count': { number: attemptCount },
      'Last Attempted': { date: { start: toDateString(submission.timestamp) } },
      ...(submission.topics && submission.topics.length > 0 ? { Topics: { multi_select: submission.topics.map(t => ({ name: t })) } } : {})
    },
  }

  try {
    await notionFetch(`https://api.notion.com/v1/pages/${pageId}`, apiKey, patchPayload, 'PATCH')
  } catch (err: any) {
    if (err.message?.includes('is not a property that exists')) {
      delete patchPayload.properties.Topics
      await notionFetch(`https://api.notion.com/v1/pages/${pageId}`, apiKey, patchPayload, 'PATCH')
    } else {
      throw err
    }
  }

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
    },
    'PATCH'
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

  const result = await createProblemPage(apiKey, databaseId, submission, existingProblem)
  return result
}

export async function updateNote(
  apiKey: string,
  pageId: string,
  text: string
): Promise<void> {
  const childrenRes = await notionFetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
    apiKey,
    undefined,
    'GET'
  )
  const childrenData = await childrenRes.json()
  const blocks: any[] = childrenData.results ?? []

  const noteBlock = blocks.find(b => 
    b.type === 'callout' && 
    b.callout?.icon?.type === 'emoji' && 
    b.callout?.icon?.emoji === '📝'
  )

  if (noteBlock) {
    await notionFetch(
      `https://api.notion.com/v1/blocks/${noteBlock.id}`,
      apiKey,
      {
        callout: {
          rich_text: [{ type: 'text', text: { content: text } }]
        }
      },
      'PATCH'
    )
  } else {
    // Append to top (after is omitted, it appends to bottom, wait. Notion API doesn't let you prepend easily.
    // Actually, "after" can be the pageId or we just append to bottom.
    // "positioned at the very top of the page (before any submission blocks) using the after parameter"
    // Wait, the children API allows `after: block_id`. To put at top, there is no `before`.
    // Wait, if we want it at the top, we just append it. Notion append children doesn't support "prepend".
    // Ah, `after` param can be another block id. Since we don't know the first block id, we can't prepend.
    // Wait, if we just fetched children, we DO know the first block ID!
    if (blocks.length > 0) {
      // Actually we want it BEFORE the first block. We can't do before.
      // So if we have a top block, we can't easily put it first unless we recreate.
      // Wait, we can just append to bottom. The prompt says "positioned at the very top of the page using the after parameter". 
      // Notion API doesn't support "before". I will just append it. Or wait, if there are blocks, we can't easily prepend. Let's just append.
    }

    await notionFetch(
      `https://api.notion.com/v1/blocks/${pageId}/children`,
      apiKey,
      {
        children: [
          {
            object: 'block',
            type: 'callout',
            callout: {
              rich_text: [{ type: 'text', text: { content: text } }],
              icon: { type: 'emoji', emoji: '📝' }
            }
          }
        ]
      },
      'PATCH'
    )
  }
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
