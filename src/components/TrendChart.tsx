import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Submission } from '../lib/types'

interface TrendChartProps {
  submissions: Submission[]
  days?: number
}

export function TrendChart({ submissions, days = 30 }: TrendChartProps) {
  const data = useMemo(() => {
    const result: { date: string; count: number; accepted: number }[] = []
    if (submissions.length === 0) return result
    const now = submissions.reduce(
      (max, s) => Math.max(max, s.timestamp),
      0
    )
    const startTs = now - days * 86400000

    const dayMap: Record<string, { count: number; accepted: number }> = {}
    for (const s of submissions) {
      if (s.timestamp < startTs) continue
      const date = new Date(s.timestamp).toISOString().split('T')[0]
      if (!dayMap[date]) dayMap[date] = { count: 0, accepted: 0 }
      dayMap[date].count++
      if (s.result === 'Accepted') dayMap[date].accepted++
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 86400000).toISOString().split('T')[0]
      result.push({
        date,
        count: dayMap[date]?.count ?? 0,
        accepted: dayMap[date]?.accepted ?? 0,
      })
    }

    return result
  }, [submissions, days])

  return (
    <div className="w-full h-48 min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickFormatter={d => {
              const parts = d.split('-')
              return `${parts[1]}/${parts[2]}`
            }}
            interval={Math.floor(days / 7)}
          />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '12px',
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#818cf8"
            strokeWidth={2}
            dot={false}
            name="Total"
          />
          <Line
            type="monotone"
            dataKey="accepted"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            name="Accepted"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
