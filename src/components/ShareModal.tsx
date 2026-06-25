import { useRef, useState, useEffect } from 'react'
import { XIcon, DownloadIcon, FlameIcon, CheckCircleIcon } from 'lucide-react'
import html2canvas from 'html2canvas'
import { useStorageData } from '../hooks/useStorage'
import { calculateStreak } from '../lib/streak'
import type { ProblemRecord } from '../lib/types'

interface ShareModalProps {
  onClose: () => void
}

export function ShareModal({ onClose }: ShareModalProps) {
  const { data } = useStorageData()
  const cardRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const solvedProblems = Object.values(data.problems).filter(p => p.status === 'Solved') as ProblemRecord[]
  const solved = solvedProblems.length
  
  const easy = solvedProblems.filter(p => p.difficulty === 'Easy').length
  const medium = solvedProblems.filter(p => p.difficulty === 'Medium').length
  const hard = solvedProblems.filter(p => p.difficulty === 'Hard').length

  const submissionDates = data.submissions.map(s =>
    new Date(s.timestamp).toISOString().split('T')[0]
  )
  const streakInfo = calculateStreak(submissionDates)

  const topicStats = solvedProblems.reduce((acc, p) => {
    if (!p.topics) return acc
    p.topics.forEach(t => {
      acc[t] = (acc[t] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const topTopics = Object.entries(topicStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  useEffect(() => {
    async function generateImage() {
      if (!cardRef.current) return
      setGenerating(true)
      try {
        // slight delay to ensure fonts/styles load
        await new Promise(r => setTimeout(r, 100))
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#0f172a', // force dark theme slate-900 background
          scale: 2, // high res
          logging: false,
          useCORS: true
        })
        setImageUrl(canvas.toDataURL('image/png'))
      } catch (err) {
        console.error('Failed to generate image', err)
      }
      setGenerating(false)
    }
    
    generateImage()
  }, [])

  function downloadImage() {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `leettrack-stats-${new Date().toISOString().split('T')[0]}.png`
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface-base)] border border-[var(--border-default)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">Share your progress</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-input)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center bg-[var(--surface-raised)] relative">
          {/* We render the card offscreen-ish or just hide the original once the image is ready */}
          <div 
            className={`transition-opacity duration-300 ${imageUrl ? 'hidden' : 'opacity-100'}`}
          >
            {/* The actual HTML element that gets screenshotted */}
            <div 
              ref={cardRef} 
              className="w-[400px] h-[480px] rounded-2xl overflow-hidden relative shadow-2xl flex flex-col"
              style={{
                background: 'linear-gradient(145deg, #0f172a, #1e1b4b)',
                color: '#f8fafc',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle at 50% 0%, #6366f1 0%, transparent 60%)'
              }}></div>
              
              <div className="relative p-8 flex-1 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                    <CheckCircleIcon size={18} className="text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">LeetTrack</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-md">
                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Solved</div>
                    <div className="text-4xl font-bold text-white">{solved}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-md">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FlameIcon size={14} className="text-orange-400" />
                      <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Streak</div>
                    </div>
                    <div className="text-4xl font-bold text-white">{streakInfo.currentStreak}<span className="text-lg text-slate-500 font-medium ml-1">days</span></div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Difficulty</div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(easy/Math.max(1,solved))*100}%`, minWidth: easy ? '4px' : '0' }}></div>
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: `${(medium/Math.max(1,solved))*100}%`, minWidth: medium ? '4px' : '0' }}></div>
                    <div className="h-2 rounded-full bg-red-500" style={{ width: `${(hard/Math.max(1,solved))*100}%`, minWidth: hard ? '4px' : '0' }}></div>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-emerald-400">{easy} Easy</span>
                    <span className="text-amber-400">{medium} Med</span>
                    <span className="text-red-400">{hard} Hard</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Top Topics</div>
                  <div className="flex flex-wrap gap-2">
                    {topTopics.map(([topic]) => (
                      <span key={topic} className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium">
                        {topic}
                      </span>
                    ))}
                    {topTopics.length === 0 && <span className="text-sm text-slate-500">No topics yet</span>}
                  </div>
                </div>
                
                <div className="mt-auto pt-6 flex justify-between items-center opacity-60">
                  <span className="text-[10px] font-medium tracking-wide">Tracked with LeetTrack</span>
                  <span className="text-[10px] font-medium tracking-wide">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
          
          {imageUrl && (
            <div className="w-[400px] rounded-2xl overflow-hidden shadow-2xl relative">
              <img src={imageUrl} alt="LeetTrack Stats" className="w-full h-auto" />
            </div>
          )}

          {generating && (
            <div className="absolute inset-0 bg-[var(--surface-raised)]/80 flex items-center justify-center backdrop-blur-sm">
              <div className="flex items-center gap-3 bg-[var(--surface-card)] px-5 py-3 rounded-xl border border-[var(--border-default)] shadow-xl">
                <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin"></div>
                <span className="text-sm font-medium text-[var(--text-primary)]">Generating card...</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[var(--border-subtle)] flex justify-end gap-3 bg-[var(--surface-card)]">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-input)] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={downloadImage}
            disabled={!imageUrl || generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--accent)] hover:brightness-110 transition-all disabled:opacity-50 shadow-sm"
          >
            <DownloadIcon size={16} />
            Download Image
          </button>
        </div>
      </div>
    </div>
  )
}
