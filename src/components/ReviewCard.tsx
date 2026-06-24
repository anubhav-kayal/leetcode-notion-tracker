import { ClockIcon, CheckCircleIcon, XCircleIcon, ExternalLinkIcon } from 'lucide-react'
import type { ReviewItem } from '../lib/spaced-repetition'

interface ReviewCardProps {
  item: ReviewItem
  onDismiss: (slug: string) => void
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-emerald-400',
  Medium: 'text-amber-400',
  Hard: 'text-red-400',
}

const DIFFICULTY_BG: Record<string, string> = {
  Easy: 'bg-emerald-900/30 border-emerald-700/50',
  Medium: 'bg-amber-900/30 border-amber-700/50',
  Hard: 'bg-red-900/30 border-red-700/50',
}

export function ReviewCard({ item, onDismiss }: ReviewCardProps) {
  return (
    <div
      className={`rounded-lg border p-3 ${DIFFICULTY_BG[item.difficulty] ?? 'bg-gray-800/50 border-gray-700/50'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-gray-200 truncate">{item.title}</h3>
            <span className={`text-[10px] font-medium ${DIFFICULTY_COLORS[item.difficulty] ?? 'text-gray-400'}`}>
              {item.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ClockIcon size={11} />
              {item.daysSinceLastAttempt}d ago
            </span>
            <span className="flex items-center gap-1">
              {item.status === 'Solved' ? (
                <CheckCircleIcon size={11} className="text-emerald-400" />
              ) : (
                <XCircleIcon size={11} className="text-red-400" />
              )}
              {item.status}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <a
            href={`https://leetcode.com/problems/${item.slug}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
            title="Open in LeetCode"
          >
            <ExternalLinkIcon size={14} className="text-gray-400" />
          </a>
          <button
            onClick={() => onDismiss(item.slug)}
            className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-gray-500 hover:text-gray-300"
            title="Dismiss"
          >
            <XCircleIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
