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
  topics?: string[]
  timeSeconds?: number
}

export interface SM2State {
  interval: number
  repetition: number
  easinessFactor: number
  nextReviewDate: number
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
  lastReviewed?: number
  reviewLevel?: number
  companies?: string[]
  topics?: string[]
  notes?: string
  notesUpdatedAt?: number
  sm2?: SM2State
}

export interface Settings {
  notionApiKey: string
  notionDatabaseId: string
  claudeApiKey: string
  theme: 'light' | 'dark' | 'system'
  targetCompany?: string
}

export interface Interview {
  id: string
  company: string
  date: number
  status: 'Upcoming' | 'Completed' | 'Cancelled'
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
  companyList: string[]
  interviews: Interview[]
}

export const TOP_COMPANIES = [
  'Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix', 'Uber', 'Airbnb', 
  'LinkedIn', 'Twitter', 'Stripe', 'Dropbox', 'Salesforce', 'Adobe', 'Oracle', 
  'Walmart', 'Bloomberg', 'Goldman Sachs', 'JPMorgan', 'ByteDance', 'Snap', 
  'Pinterest', 'Lyft', 'DoorDash', 'Coinbase', 'Robinhood', 'Atlassian', 
  'Shopify', 'Twilio', 'Palantir'
]

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
