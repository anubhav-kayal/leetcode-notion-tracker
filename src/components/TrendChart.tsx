import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Submission } from '../lib/types'

interface TrendChartProps {
  submissions: Submission[]
}

export function TrendChart({ submissions }: TrendChartProps) {
  const data = useMemo(() => {
    const result: { week: string; accepted: number; failed: number }[] = []
    
    // Aggregate by week (last 4 weeks)
    const now = Date.now()
    const weeks = 4
    
    for (let i = weeks - 1; i >= 0; i--) {
      const end = now - i * 7 * 86400000
      const start = end - 7 * 86400000
      
      let accepted = 0
      let failed = 0
      
      for (const s of submissions) {
        if (s.timestamp > start && s.timestamp <= end) {
          if (s.result === 'Accepted') accepted++
          else failed++
        }
      }
      
      const startDate = new Date(start)
      const weekLabel = `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getDate()}`
      
      result.push({
        week: weekLabel,
        accepted,
        failed
      })
    }
    return result
  }, [submissions])

  return (
    <div className="w-full h-[120px] min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="horizontal" margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis hide={true} />
          <Tooltip
            cursor={{ fill: 'var(--surface-input)' }}
            contentStyle={{
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              padding: '8px 12px',
              boxShadow: 'none'
            }}
            itemStyle={{ color: 'var(--text-primary)' }}
          />
          <Bar dataKey="accepted" name="Accepted" fill="var(--accent)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="failed" name="Failed" fill="var(--danger)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
