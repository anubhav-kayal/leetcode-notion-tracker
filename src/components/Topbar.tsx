import { useState } from 'react'
import { FlameIcon, ShareIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useThemeMode } from '../hooks/useThemeMode'
import { ShareModal } from './ShareModal'

interface TopbarProps {
  title: string
  streakCount: number
}

export function Topbar({ title, streakCount }: TopbarProps) {
  const { isDark, toggleDark } = useThemeMode()
  const [isShareOpen, setIsShareOpen] = useState(false)

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-medium text-[var(--text-primary)] tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {streakCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--warning)] bg-[var(--warning-soft)] border border-[var(--warning)]/20 rounded-full px-3 py-1.5">
            <FlameIcon size={14} />
            {streakCount}-day streak
          </div>
        )}

        <button 
          onClick={() => setIsShareOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--accent-border)] rounded-lg px-3 py-1.5 cursor-pointer hover:brightness-95 transition-all"
        >
          <ShareIcon size={14} />
          Share stats
        </button>

        <button 
          onClick={toggleDark}
          className="w-8 h-8 rounded-lg bg-[var(--surface-input)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>
      </div>

      {isShareOpen && <ShareModal onClose={() => setIsShareOpen(false)} />}
    </div>
  )
}
