import { useMemo } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import type { ProblemRecord } from '../lib/types'

export function TopicRadarChart({ problems }: { problems: Record<string, ProblemRecord> }) {
  const data = useMemo(() => {
    const stats: Record<string, { total: number; solved: number }> = {}
    
    for (const p of Object.values(problems)) {
      if (!p.topics) continue
      for (const topic of p.topics) {
        if (!stats[topic]) stats[topic] = { total: 0, solved: 0 }
        stats[topic].total++
        if (p.status === 'Solved') stats[topic].solved++
      }
    }

    return Object.entries(stats)
      .map(([subject, s]) => ({
        subject,
        A: s.total > 0 ? Math.round((s.solved / s.total) * 100) : 0,
        fullMark: 100,
        count: s.total
      }))
      // Sort by total count to show the most frequently encountered topics
      .sort((a, b) => b.count - a.count)
      .slice(0, 8) // Limit to top 8 topics for a clean radar chart
  }, [problems])

  if (data.length < 3) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm text-center px-4">
        Solve more problems with topics to generate your Topic Mastery map. (Needs at least 3 topics)
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="#cbd5e1" className="dark:stroke-slate-700" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Mastery %"
            dataKey="A"
            stroke="#6366f1"
            fill="#818cf8"
            fillOpacity={0.4}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'rgba(255, 255, 255, 0.95)' }}
            itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
