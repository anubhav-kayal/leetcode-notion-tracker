import type { Submission } from '../lib/types'

interface HeatmapProps {
  submissions: Submission[]
}

const CELL_SIZE = 12
const WEEKS_TO_SHOW = 26

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
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - WEEKS_TO_SHOW * 7)

  const cells: { date: string; count: number }[] = []
  const cursor = new Date(startDate)
  while (cursor <= today) {
    const ds = getDateString(cursor)
    cells.push({ date: ds, count: submissionCounts[ds] ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }

  const maxCount = Math.max(...cells.map(c => c.count), 1)

  function getColor(count: number): string {
    if (count === 0) return 'bg-gray-800'
    const intensity = Math.min(count / maxCount, 1)
    if (intensity <= 0.25) return 'bg-emerald-900'
    if (intensity <= 0.5) return 'bg-emerald-700'
    if (intensity <= 0.75) return 'bg-emerald-500'
    return 'bg-emerald-300'
  }

  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map(cell => (
              <div
                key={cell.date}
                className={`${getColor(cell.count)} rounded-sm`}
                style={{ width: CELL_SIZE, height: CELL_SIZE }}
                title={`${cell.date}: ${cell.count} submissions`}
              />
            ))}
            {week.length < 7 &&
              Array.from({ length: 7 - week.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="bg-transparent"
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-gray-500">Less</span>
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`rounded-sm ${getColor(i === 0 ? 0 : (maxCount / 4) * i)}`}
            style={{ width: CELL_SIZE, height: CELL_SIZE }}
          />
        ))}
        <span className="text-[10px] text-gray-500">More</span>
      </div>
    </div>
  )
}
