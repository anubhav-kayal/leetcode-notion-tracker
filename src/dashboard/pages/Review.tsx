import { useMemo } from 'react'
import { InboxIcon } from 'lucide-react'
import { useStorageData } from '../../hooks/useStorage'
import { getReviewQueue, calculateSM2 } from '../../lib/spaced-repetition'
import { ReviewCard } from '../../components/ReviewCard'

export function Review() {
  const { data, updateData } = useStorageData()

  const reviewItems = useMemo(
    () => getReviewQueue(data.problems),
    [data.problems]
  )

  async function handleRate(slug: string, quality: number) {
    await updateData(prev => {
      const p = prev.problems[slug]
      if (!p) return prev

      const newSm2 = calculateSM2(quality, p.sm2)
      
      return {
        ...prev,
        problems: {
          ...prev.problems,
          [slug]: {
            ...p,
            sm2: newSm2
          }
        }
      }
    })
  }

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium text-[var(--text-primary)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
             <InboxIcon size={16} className="text-[var(--accent)]" />
          </div>
          Review Queue
        </h1>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-6 bg-[var(--surface-card)] p-4 rounded-xl border border-[var(--border-default)] inline-block">
        {reviewItems.length > 0 ? (
          <>
            <strong className="text-slate-900 dark:text-slate-100 font-bold">{reviewItems.length}</strong> problem{reviewItems.length > 1 ? 's' : ''} due for review based on SM-2 spaced repetition.
          </>
        ) : (
          'No problems due for review. Keep up the good work!'
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviewItems.slice(0, 20).map(item => (
          <ReviewCard key={item.slug} item={item} onRate={handleRate} />
        ))}
      </div>

      {reviewItems.length > 20 && (
        <p className="text-xs text-[var(--text-tertiary)] mt-6 text-center font-medium">
          +{reviewItems.length - 20} more. Rate items to see more.
        </p>
      )}
    </div>
  )
}
