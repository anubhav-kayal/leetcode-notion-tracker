import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { FlameIcon, CheckCircleIcon, ClockIcon, TrendingUpIcon, ArrowRightIcon } from 'lucide-react'
import { useStorageData, useSettings } from '../../hooks/useStorage'
import { calculateStreak } from '../../lib/streak'
import { getReviewQueue } from '../../lib/spaced-repetition'
import { Heatmap } from '../../components/Heatmap'
import { TrendChart } from '../../components/TrendChart'
import { Topbar } from '../../components/Topbar'
import type { ProblemRecord } from '../../lib/types'

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

export function Overview() {
  const { data } = useStorageData()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [currentInterviewIdx, setCurrentInterviewIdx] = useState(0)
  const hasNotionKeys = !!(settings.notionApiKey && settings.notionDatabaseId)
  
  const upcomingInterviews = (data.interviews || []).filter(i => i.status === 'Upcoming' && i.date >= Date.now() - 86400000).sort((a, b) => a.date - b.date)

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
    { icon: FlameIcon, label: 'Current Streak', value: `${streakInfo.currentStreak}`, change: 'Keep it up!', changeIcon: TrendingUpIcon, changeColor: 'text-[var(--success)]', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-soft)]' },
    { icon: CheckCircleIcon, label: 'Problems Solved', value: String(solved), change: '+2 today', changeIcon: TrendingUpIcon, changeColor: 'text-[var(--success)]', color: 'text-[var(--success)]', bg: 'bg-[var(--success-soft)]' },
    { icon: ClockIcon, label: 'Review Queue', value: String(reviewItems.length), change: reviewItems.length > 0 ? 'Due today' : 'All caught up', changeIcon: ClockIcon, changeColor: reviewItems.length > 0 ? 'text-[var(--warning)]' : 'text-[var(--text-tertiary)]', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]' },
    { icon: TrendingUpIcon, label: 'Acceptance Rate', value: `${acceptanceRate}%`, change: 'Based on submissions', changeIcon: ClockIcon, changeColor: 'text-[var(--text-tertiary)]', color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--surface-input)]' },
  ]

  // Calculate topic weakness
  const topicStats = Object.values(data.problems).reduce((acc, p) => {
    if (!p.topics) return acc
    p.topics.forEach(t => {
      if (!acc[t]) acc[t] = { name: t, total: 0, solved: 0 }
      acc[t].total++
      if (p.status === 'Solved') acc[t].solved++
    })
    return acc
  }, {} as Record<string, { name: string; total: number; solved: number }>)
  
  const topicsList = Object.values(topicStats)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(t => {
      const pct = Math.round((t.solved / Math.max(t.total, 1)) * 100)
      return {
        ...t,
        percentage: pct,
        color: pct < 50 ? 'bg-[var(--danger)]' : pct <= 70 ? 'bg-[var(--warning)]' : 'bg-[var(--accent)]',
        textColor: pct < 50 ? 'text-[var(--danger)]' : pct <= 70 ? 'text-[var(--warning)]' : 'text-[var(--accent)]'
      }
    })

  const recentSubmissions = [...data.submissions].reverse().slice(0, 5)

  return (
    <div className="pb-10">
      <Topbar title="Overview" streakCount={streakInfo.currentStreak} />

      {!hasNotionKeys && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-700/50 rounded-2xl p-6 mb-8 flex items-center justify-between gap-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-1">Welcome to LeetTrack!</h2>
            <p className="text-indigo-800 dark:text-indigo-200 text-sm">Connect your Notion account to start auto-logging your LeetCode submissions.</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="shrink-0 flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Setup Integration <ArrowRightIcon size={16} />
          </button>
        </div>
      )}

      {upcomingInterviews.length > 0 && (() => {
        const current = upcomingInterviews[currentInterviewIdx]
        if (!current) return null
        
        const daysLeft = Math.max(0, Math.ceil((current.date - Date.now()) / 86400000))
        const targetProgress = Math.min((solved / 120) * 100, 100)
        
        return (
          <div className="bg-[var(--warning-soft)] border border-[var(--warning)]/25 rounded-2xl px-6 py-4 mb-6 flex items-center gap-8 relative group">
            <div className="flex flex-col items-center justify-center min-w-[64px]">
              <span className="text-5xl font-medium text-[var(--warning)] leading-none tracking-tighter">{daysLeft}</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--warning)]/60 mt-1">days left</span>
            </div>
            
            <div className="w-px h-10 bg-[var(--warning)]/20"></div>
            
            <div className="flex-1">
              <div className="text-sm font-medium text-[var(--text-primary)] mb-2">{current.company} Interview</div>
              <div className="h-1.5 bg-[var(--warning)]/15 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-[var(--warning)] rounded-full transition-all" style={{ width: `${targetProgress}%` }}></div>
              </div>
              <div className="text-xs text-[var(--text-secondary)]">{solved} of 120 target problems completed</div>
            </div>
            
            <div className="flex flex-col items-end justify-center">
              <div className="flex gap-1 mb-1.5">
                <div className="w-2 h-2 rounded-sm bg-[var(--accent)]"></div>
                <div className="w-2 h-2 rounded-sm bg-[var(--accent)]"></div>
                <div className="w-2 h-2 rounded-sm bg-[var(--border-default)]"></div>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">2 / 3 today</span>
            </div>

            {upcomingInterviews.length > 1 && (
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setCurrentInterviewIdx(i => i === 0 ? upcomingInterviews.length - 1 : i - 1)}
                  className="p-1 rounded bg-[var(--surface-input)] hover:bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors"
                >
                  <ChevronLeftIcon size={14} />
                </button>
                <span className="text-[10px] text-[var(--text-tertiary)] px-1">{currentInterviewIdx + 1} / {upcomingInterviews.length}</span>
                <button 
                  onClick={() => setCurrentInterviewIdx(i => (i + 1) % upcomingInterviews.length)}
                  className="p-1 rounded bg-[var(--surface-input)] hover:bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors"
                >
                  <ChevronRightIcon size={14} />
                </button>
              </div>
            )}
          </div>
        )
      })()}

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(stat => (
          <div key={stat.label} className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl p-5 hover:shadow-sm transition-all duration-150">
            <div className="flex items-start justify-between mb-2">
              <span className="text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase">{stat.label}</span>
              <div className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center ${stat.bg}`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
            <p className="text-[28px] font-medium text-[var(--text-primary)] leading-none mt-3 mb-1.5 tracking-tight">{stat.value}</p>
            <div className={`text-xs flex items-center gap-1 ${stat.changeColor}`}>
              <stat.changeIcon size={12} />
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Submission Activity
          </h2>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-x-auto">
          <Heatmap submissions={data.submissions} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase">
              30-Day Trend
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-[2px] bg-[var(--accent)]"></div>
                <span className="text-[11px] text-[var(--text-secondary)]">Accepted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-[2px] bg-[var(--danger)]"></div>
                <span className="text-[11px] text-[var(--text-secondary)]">Failed</span>
              </div>
            </div>
          </div>
          <TrendChart submissions={data.submissions} />
        </div>
        
        <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase">
              Topic Weakness
            </h2>
          </div>
          <div className="flex flex-col">
            {topicsList.length > 0 ? topicsList.map(t => (
              <div key={t.name} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className="text-xs text-[var(--text-secondary)] w-[100px] shrink-0 truncate">{t.name}</div>
                <div className="flex-1 h-1.5 bg-[var(--surface-input)] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${t.color} transition-all duration-300`} style={{ width: `${t.percentage}%` }}></div>
                </div>
                <div className={`text-xs w-8 text-right font-medium ${t.textColor}`}>{t.percentage}%</div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-input)] flex items-center justify-center mb-3">
                  <TrendingUpIcon size={20} className="text-[var(--text-tertiary)]" />
                </div>
                <h3 className="text-sm font-medium text-[var(--text-primary)]">No topics yet</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-[200px] leading-relaxed">Solve problems to see topic weaknesses</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase">
            Recent Submissions
          </h2>
        </div>
        <div className="w-full flex flex-col">
          {recentSubmissions.length > 0 ? recentSubmissions.map(s => {
            const p = data.problems[s.problemSlug]
            if (!p) return null
            return (
              <div key={s.timestamp} className="flex items-center gap-3 py-3 border-b border-[var(--border-subtle)] last:border-0 px-2 -mx-2 rounded-lg">
                <div className={`w-1.5 h-1.5 rounded-full ${s.result === 'Accepted' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                <div className="text-sm font-medium text-[var(--text-primary)] flex-1 truncate">{p.title}</div>
                
                <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  p.difficulty === 'Easy' ? 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/20' :
                  p.difficulty === 'Medium' ? 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/20' :
                  'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/20'
                }`}>
                  {p.difficulty}
                </div>
                
                <div className="text-[11px] text-[var(--text-tertiary)] w-32 truncate text-right">
                  {p.topics?.slice(0, 2).join(', ') || 'No topics'}
                </div>
                
                <div className="text-xs text-[var(--text-tertiary)] whitespace-nowrap w-28 text-right">
                  {timeAgo(s.timestamp)}{s.timeSeconds ? ` · ${Math.floor(s.timeSeconds / 60)}m ${s.timeSeconds % 60}s` : ''}
                </div>
              </div>
            )
          }) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-input)] flex items-center justify-center mb-3">
                <CheckCircleIcon size={20} className="text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-sm font-medium text-[var(--text-primary)]">No submissions yet</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-[200px] leading-relaxed">Solve a problem on LeetCode and it'll appear here automatically</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
