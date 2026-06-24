import type { Submission, StorageData } from './types'

export interface StreakInfo {
  currentStreak: number
  longestStreak: number
  lastSubmissionDate: string | null
  todaySubmitted: boolean
  current: number
  longest: number
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
    currentStreak: data.streak,
    longestStreak: data.streak,
    todaySubmitted: data.lastSubmissionDate === new Date().toISOString().split('T')[0],
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

export function calculateStreak(submissionDates: string[]): StreakInfo {
  if (submissionDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastSubmissionDate: null,
      todaySubmitted: false,
      current: 0,
      longest: 0,
      totalActiveDays: 0,
    }
  }

  const uniqueDates = [...new Set(submissionDates)].sort().reverse()

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const todaySubmitted = uniqueDates[0] === today

  let currentStreak = 0
  let expected = today

  if (!todaySubmitted) {
    expected = yesterday
  }

  for (const date of uniqueDates) {
    if (date === expected) {
      currentStreak++
      const d = new Date(expected)
      d.setDate(d.getDate() - 1)
      expected = d.toISOString().split('T')[0]
    } else if (date < expected) {
      break
    }
  }

  let longestStreak = 0
  let streak = 1
  const ascending = [...uniqueDates].reverse()

  for (let i = 1; i < ascending.length; i++) {
    const prev = new Date(ascending[i - 1])
    const curr = new Date(ascending[i])
    const diffMs = curr.getTime() - prev.getTime()
    const diffDays = Math.round(diffMs / 86400000)

    if (diffDays === 1) {
      streak++
    } else {
      longestStreak = Math.max(longestStreak, streak)
      streak = 1
    }
  }
  longestStreak = Math.max(longestStreak, streak)

  return {
    currentStreak,
    longestStreak,
    lastSubmissionDate: uniqueDates[0],
    todaySubmitted,
    current: currentStreak,
    longest: longestStreak,
    totalActiveDays: uniqueDates.length,
  }
}
