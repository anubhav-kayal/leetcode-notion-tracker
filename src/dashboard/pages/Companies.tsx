import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BuildingIcon, TargetIcon, ChevronRightIcon } from 'lucide-react'
import { useStorageData, useSettings } from '../../hooks/useStorage'

const COMPANY_ESTIMATES: Record<string, number> = {
  Google: 150, Meta: 120, Amazon: 100, Microsoft: 100, Apple: 80,
  Netflix: 50, Uber: 60, Airbnb: 40, LinkedIn: 50, Bloomberg: 70
}

export function Companies() {
  const { data } = useStorageData()
  const { settings, updateSettings } = useSettings()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const companyStats = useMemo(() => {
    const stats: Record<string, { total: number; solved: number }> = {}
    for (const p of Object.values(data.problems)) {
      if (!p.companies) continue
      for (const c of p.companies) {
        if (!stats[c]) stats[c] = { total: 0, solved: 0 }
        stats[c].total++
        if (p.status === 'Solved') stats[c].solved++
      }
    }
    return Object.entries(stats)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.total - a.total)
  }, [data.problems])

  const target = settings.targetCompany || 'Google'
  const targetStat = companyStats.find(c => c.name === target) || { total: 0, solved: 0 }
  const estimate = COMPANY_ESTIMATES[target] || 50
  
  // Actually, we should show target coverage relative to the estimate, or relative to what they've solved
  const progress = Math.min((targetStat.solved / estimate) * 100, 100)

  const suggestions = searchInput 
    ? data.companyList.filter(c => c.toLowerCase().includes(searchInput.toLowerCase()))
    : data.companyList

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BuildingIcon className="text-indigo-500" />
          Companies
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-8 shadow-sm flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 w-full relative">
          <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
            Target Company
          </label>
          <button 
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="w-full text-left bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between shadow-sm hover:border-indigo-500 transition-colors"
          >
            <span className="flex items-center gap-3">
              <CompanyLogo name={settings.targetCompany || 'Target'} fallbackIcon={<TargetIcon size={20} className="text-indigo-500" />} />
              {settings.targetCompany || 'Set your target company'}
            </span>
            <ChevronRightIcon size={20} className={`text-slate-400 transition-transform ${isPickerOpen ? 'rotate-90' : ''}`} />
          </button>
          
          {isPickerOpen && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-64 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                <input 
                  type="text" 
                  placeholder="Search companies..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {suggestions.map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      updateSettings(prev => ({ ...prev, targetCompany: c }))
                      setIsPickerOpen(false)
                      setSearchInput('')
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                  >
                    <CompanyLogo name={c} className="w-5 h-5" fallbackIcon={<BuildingIcon size={16} className="text-slate-400" />} />
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="8" fill="none" />
              <circle 
                cx="50" cy="50" r="45" 
                className="stroke-indigo-500 transition-all duration-1000 ease-out" 
                strokeWidth="8" fill="none" 
                strokeDasharray="283" 
                strokeDashoffset={283 - (283 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{targetStat.solved}</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ {estimate} solved</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 max-w-[160px] text-center">
            Estimated coverage based on community-tagged problems
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Your Coverage</h2>
      
      {companyStats.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 shadow-sm">
          No companies tagged yet. Tag problems on LeetCode to see them here!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companyStats.map(c => {
            const est = COMPANY_ESTIMATES[c.name] || 50
            const pct = Math.min((c.solved / est) * 100, 100)
            return (
              <Link 
                key={c.name}
                to={`/history?company=${encodeURIComponent(c.name)}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-sm hover:shadow-md group block"
              >
                <div className="flex items-center mb-4 gap-3">
                  <CompanyLogo name={c.name} className="w-6 h-6" fallbackIcon={<BuildingIcon size={20} className="text-indigo-500" />} />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-1">{c.name}</h3>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 shrink-0">{c.solved} solved</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CompanyLogo({ name, className = "w-5 h-5", fallbackIcon }: { name: string, className?: string, fallbackIcon: React.ReactNode }) {
  const [error, setError] = useState(false)
  
  if (error || name === 'Target') {
    return <>{fallbackIcon}</>
  }

  // Basic normalization for Clearbit API
  let domain = name.toLowerCase().replace(/\s+/g, '') + '.com'
  if (domain === 'meta.com') domain = 'fb.com' // Clearbit sometimes handles fb.com better for Meta/Facebook

  return (
    <img 
      src={`https://logo.clearbit.com/${domain}`} 
      alt={name} 
      className={`object-contain rounded bg-white ${className}`}
      onError={() => setError(true)}
    />
  )
}

