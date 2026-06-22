export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type SubmissionResult =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Runtime Error'
  | 'Compile Error'

export interface Submission {
  id: string
  problemSlug: string
  problemTitle: string
  difficulty: Difficulty
  result: SubmissionResult
  language: string
  code: string
  runtime: string
  memory: string
  timestamp: number
  leetcodeUrl: string
  notionPageId?: string
  notionPageUrl?: string
  synced: boolean
}

export interface ProblemRecord {
  slug: string
  title: string
  difficulty: Difficulty
  leetcodeUrl: string
  notionPageId: string
  notionPageUrl: string
  status: 'Attempted' | 'Solved'
  attemptCount: number
  lastAttempted: number
  firstSolved?: number
}

export interface Settings {
  notionApiKey: string
  notionDatabaseId: string
  claudeApiKey: string
}

export interface StorageData {
  submissions: Submission[]
  problems: Record<string, ProblemRecord>
  streak: number
  lastSubmissionDate: string
  totalSolved: number
  insight: { text: string; generatedAt: number } | null
  pendingQueue: Submission[]
  reviewQueue: string[]
}

export class NotionAuthError extends Error {
  constructor() {
    super('Notion API authentication failed')
    this.name = 'NotionAuthError'
  }
}

export class NotionNotFoundError extends Error {
  constructor() {
    super('Notion resource not found')
    this.name = 'NotionNotFoundError'
  }
}
