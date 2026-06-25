import type { Submission } from '../lib/types'

interface HeatmapProps {
  submissions: Submission[]
}

const CELL_SIZE = 13
const WEEKS_TO_SHOW = 52

function getDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function Heatmap({ submissions }: HeatmapProps) {
  const submissionCounts: Record<string, number> = {}
  for (const s of submissions) {
    const date = getDateString(new Date(s.timestamp))
    submissionCounts[date] = (submissionCounts[date] ?? 0) + 1
  }

  const today = new Date()
  
  // Align start date to Sunday of the target week
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - WEEKS_TO_SHOW * 7)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const cells: { date: string; count: number; isFuture: boolean }[] = []
  const cursor = new Date(startDate)
  
  // Fill cells up to Saturday of the current week to keep columns full length
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + (6 - today.getDay()))

  while (cursor <= endDate) {
    const ds = getDateString(cursor)
    cells.push({ 
      date: ds, 
      count: submissionCounts[ds] ?? 0,
      isFuture: cursor > today 
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  const maxCount = Math.max(...cells.map(c => c.count), 1)

  function getColor(count: number): string {
    if (count === 0) return 'bg-gray-100 dark:bg-[var(--surface-input)]'
    const intensity = Math.min(count / maxCount, 1)
    if (intensity <= 0.25) return 'bg-indigo-100 dark:bg-indigo-900'
    if (intensity <= 0.5) return 'bg-indigo-300 dark:bg-indigo-700'
    if (intensity <= 0.75) return 'bg-indigo-500 dark:bg-indigo-500'
    return 'bg-indigo-700 dark:bg-indigo-400'
  }

  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  // Generate month labels
  const months = []
  let currentMonth = -1
  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i]
    if (week.length > 0) {
      const date = new Date(week[0].date)
      if (date.getMonth() !== currentMonth) {
        months.push({ label: date.toLocaleString('default', { month: 'short' }), index: i })
        currentMonth = date.getMonth()
      }
    }
  }

  const totalYearly = cells.reduce((sum, cell) => sum + (cell.isFuture ? 0 : cell.count), 0)

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl p-5 mb-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase">Submission Activity</h2>
        <span className="text-xs text-[var(--accent)] cursor-pointer">2026</span>
      </div>
      
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div className="min-w-max relative pt-4">
          <div className="absolute top-0 left-0 flex w-full text-[10px] text-[var(--text-tertiary)]">
            {months.map(m => (
              <div key={m.index} className="absolute" style={{ left: m.index * (CELL_SIZE + 3) }}>
                {m.label}
              </div>
            ))}
          </div>
          
          <div className="flex gap-[3px] justify-end">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map(cell => (
                  <div
                    key={cell.date}
                    className={`${cell.isFuture ? 'bg-transparent' : getColor(cell.count)} rounded-[3px] transition-colors`}
                    style={{ width: CELL_SIZE, height: CELL_SIZE }}
                    title={cell.isFuture ? '' : `${cell.count} submissions · ${new Date(cell.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-[var(--text-secondary)]">{totalYearly} submissions in 2026</span>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`rounded-[3px] ${getColor(i === 0 ? 0 : (maxCount / 4) * i)}`}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
