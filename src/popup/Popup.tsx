import { FireIcon, ChartBarIcon, ClockIcon, Cog6ToothIcon } from 'lucide-react'
import { useStorageData, useSettings } from '../hooks/useStorage'
import { calculateStreak } from '../lib/streak'
import { getReviewQueue } from '../lib/spaced-repetition'
import type { ProblemRecord } from '../lib/types'

function openDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') })
}

function openOptions() {
  chrome.runtime.openOptionsPage?.()
}

export function Popup() {
  const { data } = useStorageData()
  const { settings } = useSettings()
  const hasNotionKeys = !!(settings.notionApiKey && settings.notionDatabaseId)

  const submissionDates = data.submissions.map(s =>
    new Date(s.timestamp).toISOString().split('T')[0]
  )
  const streakInfo = calculateStreak(submissionDates)
  const reviewItems = getReviewQueue(data.problems)

  const solved = Object.values(data.problems).filter(
    (p: ProblemRecord) => p.status === 'Solved'
  ).length
  const attempted = Object.values(data.problems).length

  return (
    <div className="w-[380px] bg-gray-950 text-white p-4 font-sans">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span className="text-indigo-400">LeetTrack</span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={openDashboard}
            className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
            title="Open Dashboard"
          >
            <ChartBarIcon size={16} className="text-gray-300" />
          </button>
          <button
            onClick={openOptions}
            className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
            title="Settings"
          >
            <Cog6ToothIcon size={16} className="text-gray-300" />
          </button>
        </div>
      </div>

      {!hasNotionKeys && (
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 mb-3 text-sm text-amber-200">
          Notion API not configured.{' '}
          <button onClick={openOptions} className="underline text-amber-100 font-medium">
            Open settings
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <StatCard
          icon={<FireIcon size={16} className="text-orange-400" />}
          label="Streak"
          value={`${streakInfo.currentStreak}d`}
          sub={streakInfo.todaySubmitted ? 'Today ✓' : 'Not yet'}
        />
        <StatCard
          icon={<ChartBarIcon size={16} className="text-emerald-400" />}
          label="Solved"
          value={String(solved)}
          sub={`${attempted} attempted`}
        />
        <StatCard
          icon={<ClockIcon size={16} className="text-blue-400" />}
          label="Review"
          value={String(reviewItems.length)}
          sub={reviewItems.length > 0 ? 'Due now' : 'All caught up'}
        />
      </div>

      {data.insight && (
        <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-3 mb-3">
          <p className="text-xs text-indigo-300 font-medium mb-1">AI Insight</p>
          <p className="text-xs text-gray-300 leading-relaxed">{data.insight.text}</p>
        </div>
      )}

      {data.submissions.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
            Recent Activity
          </p>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
            {[...data.submissions].reverse().slice(0, 5).map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between text-xs bg-gray-800/50 rounded px-2.5 py-1.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 truncate">{s.problemTitle}</p>
                  <p className="text-gray-500">
                    {s.language} · {s.runtime}
                  </p>
                </div>
                <span
                  className={`shrink-0 ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    s.result === 'Accepted'
                      ? 'bg-emerald-900/50 text-emerald-300'
                      : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {s.result === 'Accepted' ? 'AC' : 'WA'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={openDashboard}
        className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
      >
        Open Full Dashboard
      </button>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="bg-gray-800/60 rounded-lg p-2.5 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-[10px] text-gray-600">{sub}</p>
    </div>
  )
}
