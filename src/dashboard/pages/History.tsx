import { useState, useMemo } from 'react'
import { SearchIcon, ExternalLinkIcon } from 'lucide-react'
import { useStorageData } from '../../hooks/useStorage'
import type { ProblemRecord } from '../../lib/types'

type SortField = 'date' | 'title' | 'difficulty' | 'result'
type SortDir = 'asc' | 'desc'

export function History() {
  const { data } = useStorageData()
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [resultFilter, setResultFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

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
    if (resultFilter !== 'all') {
      items = items.filter(p => p.status === resultFilter)
    }

    items.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'difficulty': {
          const order = { Easy: 0, Medium: 1, Hard: 2 }
          cmp = (order[a.difficulty] ?? 0) - (order[b.difficulty] ?? 0)
          break
        }
        case 'result':
          cmp = a.status.localeCompare(b.status)
          break
        case 'date':
        default:
          cmp = a.lastAttempted - b.lastAttempted
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return items
  }, [problems, search, difficultyFilter, resultFilter, sortField, sortDir])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">History</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={difficultyFilter}
          onChange={e => setDifficultyFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select
          value={resultFilter}
          onChange={e => setResultFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="Solved">Solved</option>
          <option value="Attempted">Attempted</option>
        </select>
      </div>

      <div className="bg-gray-800/30 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <Th sortable onClick={() => toggleSort('title')} active={sortField === 'title'} dir={sortDir}>
                Problem
              </Th>
              <Th sortable onClick={() => toggleSort('difficulty')} active={sortField === 'difficulty'} dir={sortDir}>
                Difficulty
              </Th>
              <Th sortable onClick={() => toggleSort('result')} active={sortField === 'result'} dir={sortDir}>
                Status
              </Th>
              <Th className="text-right">Attempts</Th>
              <Th sortable onClick={() => toggleSort('date')} active={sortField === 'date'} dir={sortDir}>
                Last Attempt
              </Th>
              <Th className="text-right">Link</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.slug} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                <td className="py-3 px-4">
                  <span className="text-gray-200 font-medium">{p.title}</span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-medium ${
                      p.difficulty === 'Easy'
                        ? 'text-emerald-400'
                        : p.difficulty === 'Medium'
                          ? 'text-amber-400'
                          : 'text-red-400'
                    }`}
                  >
                    {p.difficulty}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-medium ${
                      p.status === 'Solved' ? 'text-emerald-400' : 'text-gray-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-gray-400">{p.attemptCount}</td>
                <td className="py-3 px-4 text-gray-400">
                  {new Date(p.lastAttempted).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <a
                    href={p.leetcodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-gray-500 hover:text-gray-300"
                  >
                    <ExternalLinkIcon size={14} />
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No problems found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({
  children,
  sortable,
  onClick,
  active,
  dir,
  className,
}: {
  children: React.ReactNode
  sortable?: boolean
  onClick?: () => void
  active?: boolean
  dir?: SortDir
  className?: string
}) {
  return (
    <th
      className={`py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${
        sortable ? 'cursor-pointer hover:text-gray-300 select-none' : ''
      } ${className ?? ''}`}
      onClick={sortable ? onClick : undefined}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortable && active && (
          <span className="text-indigo-400">{dir === 'asc' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  )
}
