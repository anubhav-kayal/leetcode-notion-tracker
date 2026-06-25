import { useState, useEffect, useRef } from 'react'

export function FloatingWidget({ slug, onClose }: { slug: string, onClose: () => void }) {
  const [notes, setNotes] = useState('')
  const [companies, setCompanies] = useState<string[]>([])
  const [companyInput, setCompanyInput] = useState('')
  const [companyList, setCompanyList] = useState<string[]>([])
  const [isFocused, setIsFocused] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    chrome.storage.local.get('leetrackData', (res) => {
      const data = res.leetrackData as any
      if (data?.companyList) {
        setCompanyList(data.companyList)
      }
      if (data?.problems?.[slug]) {
        const p = data.problems[slug]
        if (p.companies) setCompanies(p.companies)
        if (p.notes) setNotes(p.notes)
      }
    })
  }, [slug])

  const suggestions = companyInput 
    ? companyList.filter(c => c.toLowerCase().includes(companyInput.toLowerCase()) && !companies.includes(c))
    : []

  function handleSave() {
    chrome.runtime.sendMessage({ 
      type: 'TAG_PROBLEM', 
      data: { slug, companies, notes }
    })
    onClose()
  }

  function addCompany(c: string) {
    if (!companies.includes(c)) {
      setCompanies([...companies, c])
    }
    setCompanyInput('')
    inputRef.current?.focus()
  }

  function removeCompany(c: string) {
    setCompanies(companies.filter(x => x !== c))
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSave()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [notes, companies])

  return (
    <div className="fixed bottom-[80px] right-[24px] z-[99999] w-[300px] bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-4 text-slate-200 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-300">📝 LeetTrack — log details</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="relative mb-3">
        <input
          ref={inputRef}
          type="text"
          placeholder="Tag companies (e.g. Google)"
          value={companyInput}
          onChange={e => setCompanyInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={e => {
            if (e.key === 'Enter' && companyInput) {
              e.preventDefault()
              if (suggestions.length > 0) {
                addCompany(suggestions[0])
              } else {
                addCompany(companyInput.trim())
              }
            }
          }}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-32 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
            {suggestions.map(s => (
              <div 
                key={s} 
                className="px-3 py-1.5 text-sm hover:bg-slate-700 cursor-pointer text-slate-300"
                onMouseDown={(e) => { e.preventDefault(); addCompany(s) }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      {companies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {companies.map(c => (
            <span key={c} className="inline-flex items-center gap-1 bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 rounded-full px-2 py-0.5 text-[11px] font-medium">
              {c}
              <button onClick={() => removeCompany(c)} className="hover:text-indigo-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mb-3 relative">
        <textarea
          placeholder="What's the key insight? What would you tell yourself if you saw this again?"
          value={notes}
          onChange={e => setNotes(e.target.value.slice(0, 500))}
          className="w-full h-20 resize-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <div className={`absolute bottom-2 right-2 text-[10px] ${notes.length >= 500 ? 'text-red-400' : 'text-slate-500'}`}>
          {500 - notes.length}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500">Cmd/Ctrl+Enter to save</span>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-300 transition-colors">Skip</button>
          <button 
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
