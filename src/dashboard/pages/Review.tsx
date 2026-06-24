import { useMemo } from 'react'
import { RefreshCwIcon } from 'lucide-react'
import { useStorageData } from '../../hooks/useStorage'
import { getReviewQueue } from '../../lib/spaced-repetition'
import { ReviewCard } from '../../components/ReviewCard'

export function Review() {
  const { data, updateData } = useStorageData()

  const reviewItems = useMemo(
    () => getReviewQueue(data.problems),
    [data.problems]
  )

  async function handleDismiss(slug: string) {
    await updateData(prev => ({
      ...prev,
      reviewQueue: [...(prev.reviewQueue ?? []), slug],
    }))
  }

  async function handleRefreshReview() {
    await updateData(prev => ({
      ...prev,
      reviewQueue: [],
    }))
  }

  const visibleItems = reviewItems.filter(
    item => !(data.reviewQueue ?? []).includes(item.slug)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Review</h1>
        <button
          onClick={handleRefreshReview}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
        >
          <RefreshCwIcon size={14} />
          Refresh
        </button>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        {visibleItems.length > 0
          ? `${visibleItems.length} problem${visibleItems.length > 1 ? 's' : ''} due for review`
          : 'No problems due for review. Keep up the good work!'}
      </p>

      <div className="space-y-3">
        {visibleItems.slice(0, 20).map(item => (
          <ReviewCard key={item.slug} item={item} onDismiss={handleDismiss} />
        ))}
      </div>

      {visibleItems.length > 20 && (
        <p className="text-sm text-gray-500 mt-3">
          +{visibleItems.length - 20} more. Dismiss items to see more.
        </p>
      )}
    </div>
  )
}
