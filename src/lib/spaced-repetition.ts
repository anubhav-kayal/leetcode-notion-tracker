import type { StorageData, ProblemRecord } from './types'

export const REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30, 90]

export interface ReviewItem {
  slug: string
  dueDate: number
  reviewLevel: number
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
      due.push({ slug, dueDate: now, reviewLevel: level })
      continue
    }
    const lastReview = record.lastReviewed ?? record.firstSolved ?? record.lastAttempted
    const dueDate = lastReview + interval * 86400000
    if (dueDate <= now) {
      due.push({ slug, dueDate, reviewLevel: level })
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
