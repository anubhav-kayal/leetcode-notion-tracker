import { useNavigate } from 'react-router-dom'
import { FlameIcon, CheckCircleIcon, ClockIcon, TrendingUpIcon, ArrowRightIcon } from 'lucide-react'
import { useStorageData, useSettings } from '../../hooks/useStorage'
import { calculateStreak } from '../../lib/streak'
import { getReviewQueue } from '../../lib/spaced-repetition'
import { Heatmap } from '../../components/Heatmap'
import { TrendChart } from '../../components/TrendChart'
import type { ProblemRecord } from '../../lib/types'

export function Overview() {
  const { data } = useStorageData()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const hasNotionKeys = !!(settings.notionApiKey && settings.notionDatabaseId)

  const submissionDates = data.submissions.map(s =>
    new Date(s.timestamp).toISOString().split('T')[0]
  )
  const streakInfo = calculateStreak(submissionDates)
  const reviewItems = getReviewQueue(data.problems)

  const solved = Object.values(data.problems).filter(
    (p: ProblemRecord) => p.status === 'Solved'
  ).length
  const acceptanceRate =
    data.submissions.length > 0
      ? Math.round(
          (data.submissions.filter(s => s.result === 'Accepted').length /
            data.submissions.length) *
            100
        )
      : 0

  const stats = [
    { icon: FlameIcon, label: 'Current Streak', value: `${streakInfo.currentStreak} days`, color: 'text-orange-400' },
    { icon: CheckCircleIcon, label: 'Problems Solved', value: String(solved), color: 'text-emerald-400' },
    { icon: ClockIcon, label: 'Review Queue', value: String(reviewItems.length), color: 'text-blue-400' },
    { icon: TrendingUpIcon, label: 'Acceptance Rate', value: `${acceptanceRate}%`, color: 'text-purple-400' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>

      {!hasNotionKeys && (
        <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-xl p-5 mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-indigo-300 mb-1">Welcome to LeetTrack!</h2>
            <p className="text-sm text-gray-400">Connect your Notion account to start auto-logging LeetCode submissions.</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
          >
            Setup <ArrowRightIcon size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-gray-800/50 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={18} className={stat.color} />
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          Submission Activity
        </h2>
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800">
          <Heatmap submissions={data.submissions} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          30-Day Trend
        </h2>
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800">
          <TrendChart submissions={data.submissions} />
        </div>
      </div>
    </div>
  )
}
