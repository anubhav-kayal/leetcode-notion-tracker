import type { StorageData, ProblemRecord, SM2State } from './types'

export interface ReviewItem {
  slug: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  status: 'Attempted' | 'Solved'
  lastAttempted: number
  daysSinceLastAttempt: number
  dueDate: number
  notes?: string
  sm2?: SM2State
}

export function calculateSM2(quality: number, previousState?: SM2State): SM2State {
  let { interval, repetition, easinessFactor } = previousState ?? { interval: 0, repetition: 0, easinessFactor: 2.5 }

  if (quality >= 3) {
    if (repetition === 0) {
      interval = 1
    } else if (repetition === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easinessFactor)
    }
    repetition++
  } else {
    repetition = 0
    interval = 1
  }

  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easinessFactor < 1.3) easinessFactor = 1.3

  return {
    interval,
    repetition,
    easinessFactor,
    nextReviewDate: Date.now() + interval * 86400000
  }
}

export function getReviewQueue(
  problems: Record<string, ProblemRecord>
): ReviewItem[] {
  const now = Date.now()
  const items: ReviewItem[] = []

  for (const problem of Object.values(problems)) {
    const daysSince = Math.floor((now - problem.lastAttempted) / 86400000)
    
    if (problem.sm2) {
      if (now >= problem.sm2.nextReviewDate) {
        items.push({
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          status: problem.status,
          lastAttempted: problem.lastAttempted,
          daysSinceLastAttempt: daysSince,
          dueDate: problem.sm2.nextReviewDate,
          notes: problem.notes,
          sm2: problem.sm2
        })
      }
    } else {
      // Un-initialized problems (legacy support or just newly scraped)
      // If it's been at least 1 day since last attempt, put it in review queue
      if (daysSince >= 1) {
        items.push({
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          status: problem.status,
          lastAttempted: problem.lastAttempted,
          daysSinceLastAttempt: daysSince,
          dueDate: problem.lastAttempted + 86400000,
          notes: problem.notes,
          sm2: undefined
        })
      }
    }
  }

  // Sort by most overdue first
  return items.sort((a, b) => a.dueDate - b.dueDate)
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
