import type { Submission, StorageData } from './types'

export interface StreakInfo {
  current: number
  longest: number
  lastSubmissionDate: string
  totalActiveDays: number
}

export function getStreakHistory(submissions: Submission[]): string[] {
  const dates = submissions.map(s =>
    new Date(s.timestamp).toISOString().split('T')[0]
  )
  return [...new Set(dates)].sort()
}

export function getDailyCounts(submissions: Submission[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const s of submissions) {
    const date = new Date(s.timestamp).toISOString().split('T')[0]
    counts[date] = (counts[date] || 0) + 1
  }
  return counts
}

export function updateStreak(data: StorageData, submissionDate: string): StorageData {
  const today = submissionDate
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (data.lastSubmissionDate === today) {
    return data
  }

  if (data.lastSubmissionDate === yesterday) {
    data.streak += 1
  } else if (data.lastSubmissionDate !== today) {
    data.streak = 1
  }

  data.lastSubmissionDate = today
  return data
}

export function getStreakInfo(data: StorageData): StreakInfo {
  return {
    current: data.streak,
    longest: data.streak,
    lastSubmissionDate: data.lastSubmissionDate,
    totalActiveDays: data.streak,
  }
}

export function computeLongestStreak(submissions: Submission[]): number {
  const dates = getStreakHistory(submissions)
  if (dates.length === 0) return 0

  let longest = 1
  let current = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diffDays = (curr.getTime() - prev.getTime()) / 86400000
    if (diffDays === 1) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}
