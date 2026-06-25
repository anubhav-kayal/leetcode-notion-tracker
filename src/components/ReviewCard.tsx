import { ClockIcon, CheckCircleIcon, XCircleIcon, ExternalLinkIcon } from 'lucide-react'
import type { ReviewItem } from '../lib/spaced-repetition'

interface ReviewCardProps {
  item: ReviewItem
  onRate: (slug: string, quality: number) => void
}

export function ReviewCard({ item, onRate }: ReviewCardProps) {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl p-5 hover:shadow-sm transition-all flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">{item.title}</h3>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${
              item.difficulty === 'Easy' ? 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/20' :
              item.difficulty === 'Medium' ? 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/20' :
              'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/20'
            }`}>
              {item.difficulty}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <ClockIcon size={12} className="text-[var(--text-tertiary)]" />
              {item.daysSinceLastAttempt}d ago
            </span>
            <span className="flex items-center gap-1.5">
              {item.status === 'Solved' ? (
                <CheckCircleIcon size={12} className="text-[var(--success)]" />
              ) : (
                <XCircleIcon size={12} className="text-[var(--danger)]" />
              )}
              {item.status}
            </span>
          </div>
          
          {item.notes && (
            <div className="mt-4 bg-[var(--surface-input)] rounded-lg p-3 border border-[var(--border-subtle)]">
              <div className="flex gap-2">
                <span className="text-sm">📝</span>
                <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">{item.notes}</p>
              </div>
            </div>
          )}
        </div>
        
        <a
          href={`https://leetcode.com/problems/${item.slug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-2 rounded-lg bg-[var(--surface-input)] hover:bg-[var(--surface-raised)] border border-[var(--border-default)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--accent)]"
          title="Open in LeetCode"
        >
          <ExternalLinkIcon size={14} />
        </a>
      </div>
      
      <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <button
          onClick={() => onRate(item.slug, 0)}
          className="flex-1 text-xs text-[var(--danger)] bg-[var(--danger-soft)] hover:bg-[var(--danger)]/20 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
          title="Complete blackout, don't remember"
        >
          Forgot (0)
        </button>
        <button
          onClick={() => onRate(item.slug, 2)}
          className="flex-1 text-xs text-[var(--warning)] bg-[var(--warning-soft)] hover:bg-[var(--warning)]/20 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
          title="Remembered, but took significant effort"
        >
          Hard (2)
        </button>
        <button
          onClick={() => onRate(item.slug, 4)}
          className="flex-1 text-xs text-[var(--accent)] bg-[var(--accent-soft)] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
          title="Remembered with slight hesitation"
        >
          Good (4)
        </button>
        <button
          onClick={() => onRate(item.slug, 5)}
          className="flex-1 text-xs text-[var(--success)] bg-[var(--success-soft)] hover:bg-[var(--success)]/20 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
          title="Perfect response, immediately remembered"
        >
          Easy (5)
        </button>
      </div>
    </div>
  )
}
