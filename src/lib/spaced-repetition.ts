import type { StorageData, ProblemRecord } from './types'

export const REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30, 90]

export interface ReviewItem {
  slug: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  status: 'Attempted' | 'Solved'
  lastAttempted: number
  daysSinceLastAttempt: number
  priority: number
  dueDate: number
  reviewLevel: number
}

const INTERVALS_DAYS = [1, 3, 7, 14, 30]

export function getReviewQueue(
  problems: Record<string, ProblemRecord>
): ReviewItem[] {
  const now = Date.now()
  const items: ReviewItem[] = []

  for (const problem of Object.values(problems)) {
    const daysSince = Math.floor((now - problem.lastAttempted) / 86400000)
    let priority = 0

    if (problem.status === 'Attempted') {
      priority = daysSince >= 1 ? 5 : 0
    } else {
      for (let i = 0; i < INTERVALS_DAYS.length; i++) {
        if (daysSince >= INTERVALS_DAYS[i] && daysSince < (INTERVALS_DAYS[i + 1] ?? Infinity)) {
          priority = INTERVALS_DAYS.length - i
          break
        }
      }
      if (daysSince >= INTERVALS_DAYS[INTERVALS_DAYS.length - 1]) {
        priority = 0
      }
    }

    if (priority > 0) {
      items.push({
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        status: problem.status,
        lastAttempted: problem.lastAttempted,
        daysSinceLastAttempt: daysSince,
        priority,
        dueDate: problem.lastAttempted + (INTERVALS_DAYS[0] ?? 1) * 86400000,
        reviewLevel: problem.reviewLevel ?? 0,
      })
    }
  }

  return items.sort((a, b) => b.priority - a.priority)
}

export function shouldReview(item: ReviewItem): boolean {
  return item.priority >= 3
}

export function nextReviewDate(lastAttempted: number, solved: boolean): number {
  if (!solved) return lastAttempted + 86400000
  return lastAttempted + INTERVALS_DAYS[0] * 86400000
}

export function getDueProblems(
  problems: Record<string, ProblemRecord>,
  now: number = Date.now()
): ReviewItem[] {
  const due: ReviewItem[] = []

  for (const [slug, record] of Object.entries(problems)) {
    if (record.status !== 'Solved') continue
    const level = record.reviewLevel ?? 0
    const interval = REVIEW_INTERVALS[Math.min(level, REVIEW_INTERVALS.length - 1)]
    if (interval === 0) {
      due.push({
        slug,
        dueDate: now,
        reviewLevel: level,
        title: record.title,
        difficulty: record.difficulty,
        status: record.status,
        lastAttempted: record.lastAttempted,
        daysSinceLastAttempt: Math.floor((now - record.lastAttempted) / 86400000),
        priority: 0,
      })
      continue
    }
    const lastReview = record.lastReviewed ?? record.firstSolved ?? record.lastAttempted
    const dueDate = lastReview + interval * 86400000
    if (dueDate <= now) {
      due.push({
        slug,
        dueDate,
        reviewLevel: level,
        title: record.title,
        difficulty: record.difficulty,
        status: record.status,
        lastAttempted: record.lastAttempted,
        daysSinceLastAttempt: Math.floor((now - record.lastAttempted) / 86400000),
        priority: 0,
      })
    }
  }

  return due.sort((a, b) => a.dueDate - b.dueDate)
}

export function getNextReviewLevel(currentLevel: number): number {
  return Math.min(currentLevel + 1, REVIEW_INTERVALS.length - 1)
}

export function scheduleNextReview(record: ProblemRecord): {
  lastReviewed: number
  reviewLevel: number
} {
  const now = Date.now()
  return {
    lastReviewed: now,
    reviewLevel: getNextReviewLevel(record.reviewLevel ?? 0),
  }
}

export function addToReviewQueue(data: StorageData, slug: string): StorageData {
  if (!data.reviewQueue.includes(slug)) {
    data.reviewQueue.push(slug)
  }
  return data
}

export function removeFromReviewQueue(data: StorageData, slug: string): StorageData {
  data.reviewQueue = data.reviewQueue.filter(s => s !== slug)
  return data
}

export function getReviewQueueProblems(
  data: StorageData
): ProblemRecord[] {
  return data.reviewQueue
    .map(slug => data.problems[slug])
    .filter((p): p is ProblemRecord => p !== undefined)
}
