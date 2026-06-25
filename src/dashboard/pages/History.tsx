import { useState, useMemo, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchIcon, ExternalLinkIcon, BuildingIcon, ClockIcon } from 'lucide-react'
import { useStorageData } from '../../hooks/useStorage'
import type { ProblemRecord } from '../../lib/types'

type SortField = 'date' | 'title' | 'difficulty' | 'result'
type SortDir = 'asc' | 'desc'

function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function History() {
  const { data } = useStorageData()
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [searchParams, setSearchParams] = useSearchParams()
  const companyFilter = searchParams.get('company')
  
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  const problems = Object.values(data.problems) as ProblemRecord[]

  const filtered = useMemo(() => {
    let items = [...problems]

    if (search) {
      const q = search.toLowerCase()
      items = items.filter(p => p.title.toLowerCase().includes(q) || p.slug.includes(q))
    }
    if (difficultyFilter !== 'all') {
      items = items.filter(p => p.difficulty === difficultyFilter)
    }
    if (companyFilter) {
      items = items.filter(p => p.companies?.includes(companyFilter))
    }

    items.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortField) {
        case 'title':
          return a.title.localeCompare(b.title) * dir
        case 'difficulty': {
          const order = { Easy: 0, Medium: 1, Hard: 2 }
          return ((order[a.difficulty] ?? 0) - (order[b.difficulty] ?? 0)) * dir
        }
        case 'result':
          return a.status.localeCompare(b.status) * dir
        case 'date':
        default:
          return (a.lastAttempted - b.lastAttempted) * dir
      }
    })

    return items
  }, [problems, search, difficultyFilter, sortField, sortDir, companyFilter])

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium text-[var(--text-primary)] flex items-center gap-3">
          History
          {companyFilter && (
            <span className="flex items-center gap-1.5 text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] px-3 py-1 rounded-full">
              <BuildingIcon size={14} />
              {companyFilter}
              <button 
                onClick={() => {
                  searchParams.delete('company')
                  setSearchParams(searchParams)
                }}
                className="ml-1 hover:text-[var(--accent)]/70"
              >
                ×
              </button>
            </span>
          )}
        </h1>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm bg-[var(--surface-input)] border border-[var(--border-default)] rounded-lg py-2 pl-9 pr-3 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-1 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-1.5">
          {['all', 'Easy', 'Medium', 'Hard'].map(diff => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-150 ${
                difficultyFilter === diff
                  ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent)]'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-tertiary)]'
              }`}
            >
              {diff === 'all' ? 'All' : diff}
            </button>
          ))}
        </div>

        <select
          value={`${sortField}-${sortDir}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split('-')
            setSortField(field as SortField)
            setSortDir(dir as SortDir)
          }}
          className="ml-auto w-36 text-sm bg-[var(--surface-input)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-1 transition-all"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="difficulty-desc">Hardest first</option>
          <option value="difficulty-asc">Easiest first</option>
          <option value="title-asc">A-Z</option>
        </select>
      </div>

      <div className="w-full mt-6">
        <div className="flex items-center text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)] pb-3 border-b border-[var(--border-default)] gap-3 px-3">
          <div className="flex-[2]">Problem</div>
          <div className="w-20">Difficulty</div>
          <div className="w-24">Status</div>
          <div className="w-20 text-right">Attempts</div>
          <div className="w-24 text-right">Last tried</div>
          <div className="w-24 text-right">Time</div>
          <div className="w-10 text-right">Actions</div>
        </div>
        
        <div className="flex flex-col">
          {filtered.map(p => (
            <Fragment key={p.slug}>
              <div 
                className="flex items-center gap-3 py-3.5 border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)] transition-colors cursor-pointer px-3 -mx-3 rounded-lg"
                onClick={() => setExpandedSlug(expandedSlug === p.slug ? null : p.slug)}
              >
                <div className="flex-[2] text-sm text-[var(--text-primary)] truncate font-medium">{p.title}</div>
                
                <div className="w-20">
                  <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    p.difficulty === 'Easy' ? 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/20' :
                    p.difficulty === 'Medium' ? 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/20' :
                    'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/20'
                  }`}>
                    {p.difficulty}
                  </span>
                </div>
                
                <div className="w-24">
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${
                    p.status === 'Solved' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--surface-input)] text-[var(--text-tertiary)]'
                  }`}>
                    {p.status}
                  </span>
                </div>
                
                <div className="w-20 text-right text-sm text-[var(--text-secondary)]">{p.attemptCount}</div>
                
                <div className="w-24 text-right text-xs text-[var(--text-secondary)]">
                  {timeAgo(p.lastAttempted)}
                </div>
                
                <div className="w-24 text-right text-xs text-[var(--text-secondary)]">
                  {p.status === 'Solved' && data.submissions.find(s => s.problemSlug === p.slug && s.result === 'Accepted')?.timeSeconds 
                    ? `${Math.floor((data.submissions.find(s => s.problemSlug === p.slug && s.result === 'Accepted')!.timeSeconds!) / 60)}m ${data.submissions.find(s => s.problemSlug === p.slug && s.result === 'Accepted')!.timeSeconds! % 60}s`
                    : '-'}
                </div>
                
                <div className="w-10 flex justify-end">
                  <a
                    href={p.leetcodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors p-1"
                  >
                    <ExternalLinkIcon size={14} />
                  </a>
                </div>
              </div>
              
              {expandedSlug === p.slug && (
                <div className="bg-[var(--surface-input)] px-4 py-3 rounded-lg my-1 mx-2 border border-[var(--border-subtle)] text-sm">
                  <h4 className="text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase mb-2">Submission History</h4>
                  <div className="flex flex-col gap-2">
                    {data.submissions.filter(s => s.problemSlug === p.slug).map(sub => (
                      <div key={sub.timestamp} className="flex items-center gap-3 text-xs text-[var(--text-primary)] bg-[var(--surface-card)] px-3 py-2 rounded-md border border-[var(--border-default)]">
                        <div className={`w-1.5 h-1.5 rounded-full ${sub.result === 'Accepted' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                        <div className="w-20 font-medium">{sub.result}</div>
                        <div className="w-24 flex items-center gap-1.5 text-[var(--text-tertiary)]">
                          <ClockIcon size={12} />
                          {sub.timeSeconds ? `${Math.floor(sub.timeSeconds / 60)}m ${sub.timeSeconds % 60}s` : '-'}
                        </div>
                        <div className="w-20 text-[var(--text-tertiary)]">{sub.runtime}</div>
                        <div className="w-20 text-[var(--text-tertiary)]">{sub.memory}</div>
                        <div className="ml-auto text-[var(--text-tertiary)]">{new Date(sub.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                      </div>
                    ))}
                    {data.submissions.filter(s => s.problemSlug === p.slug).length === 0 && (
                      <div className="text-xs text-[var(--text-tertiary)]">No detailed submission history available.</div>
                    )}
                  </div>
                </div>
              )}
            </Fragment>
          ))}
          
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-input)] flex items-center justify-center mb-3">
                <SearchIcon size={24} className="text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-sm font-medium text-[var(--text-primary)]">No problems found</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-[200px] leading-relaxed">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
