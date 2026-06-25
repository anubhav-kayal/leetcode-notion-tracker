import { FlameIcon, ChartBarIcon, ClockIcon, CogIcon, ArrowRightIcon } from 'lucide-react'
import { useStorageData, useSettings } from '../hooks/useStorage'
import { calculateStreak } from '../lib/streak'
import { getReviewQueue } from '../lib/spaced-repetition'
import { useThemeMode } from '../hooks/useThemeMode'
import type { ProblemRecord } from '../lib/types'

function openDashboard() {
  chrome.runtime.openOptionsPage?.()
}

function openOptions() {
  chrome.runtime.openOptionsPage?.()
}

function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function Popup() {
  useThemeMode()
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

  return (
    <div className="w-[380px] min-h-[440px] bg-[var(--surface-base)] text-[var(--text-primary)] p-0 font-sans flex flex-col transition-colors duration-300">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-card)]">
        <h1 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
          <div className="w-5 h-5 rounded-md bg-[var(--accent)] flex items-center justify-center">
             <ChartBarIcon size={12} className="text-white" />
          </div>
          LeetTrack
        </h1>
        <button
          onClick={openOptions}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md"
          title="Settings"
        >
          <CogIcon size={16} />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 overflow-y-auto custom-scrollbar">
        {!hasNotionKeys && (
          <div className="bg-[var(--warning-soft)] border border-[var(--warning)]/20 rounded-xl p-3 mb-4 flex items-center justify-between cursor-pointer hover:bg-[var(--warning)]/10 transition-colors" onClick={openOptions}>
            <div>
              <p className="text-xs font-medium text-[var(--warning)] mb-0.5">Notion disconnected</p>
              <p className="text-[10px] text-[var(--warning)]/70">Connect database to track</p>
            </div>
            <ArrowRightIcon size={14} className="text-[var(--warning)]" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-6">
          <StatCard
            icon={<FlameIcon size={14} className="text-[var(--warning)]" />}
            label="Streak"
            value={`${streakInfo.currentStreak}d`}
            bg="bg-[var(--warning-soft)]"
          />
          <StatCard
            icon={<ChartBarIcon size={14} className="text-[var(--success)]" />}
            label="Solved"
            value={String(solved)}
            bg="bg-[var(--success-soft)]"
          />
          <StatCard
            icon={<ClockIcon size={14} className="text-[var(--accent)]" />}
            label="Review"
            value={String(reviewItems.length)}
            bg="bg-[var(--accent-soft)]"
          />
        </div>

        {data.insight && (
          <div className="bg-[var(--surface-input)] border border-[var(--border-default)] rounded-xl p-3.5 mb-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]"></div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-secondary)]">AI Insight</p>
            </div>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">{data.insight.text}</p>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Recent Submissions
            </p>
            <span className="text-[10px] text-[var(--accent)] cursor-pointer hover:underline" onClick={openDashboard}>View all</span>
          </div>
          
          {data.submissions.length > 0 ? (
            <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl overflow-hidden flex flex-col">
              {[...data.submissions].reverse().slice(0, 5).map((s, i) => (
                <div
                  key={s.id + i}
                  className="flex items-center gap-3 px-3 py-3 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
                  onClick={openDashboard}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.result === 'Accepted' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.problemTitle}</p>
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary)] shrink-0 whitespace-nowrap">
                    {timeAgo(s.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <ChartBarIcon size={20} className="text-[var(--text-tertiary)] mb-2" />
              <p className="text-xs font-medium text-[var(--text-primary)]">No activity yet</p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Submit on LeetCode to see history</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-[var(--surface-base)] border-t border-[var(--border-subtle)]">
        <button
          onClick={openDashboard}
          className="w-full py-2 bg-[var(--surface-input)] hover:bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg text-xs font-medium transition-colors"
        >
          Open Full Dashboard
        </button>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bg: string
}) {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl py-2.5 px-1 flex flex-col items-center justify-center">
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${bg}`}>{icon}</div>
        <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase">{label}</p>
      </div>
      <p className="text-lg font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
