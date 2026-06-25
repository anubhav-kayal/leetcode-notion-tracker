import { useState } from 'react'
import { CalendarIcon, PlusIcon, TrashIcon, BuildingIcon } from 'lucide-react'
import { useStorageData } from '../../hooks/useStorage'
import { Topbar } from '../../components/Topbar'
import type { Interview } from '../../lib/types'

export function Interviews() {
  const { data, updateData } = useStorageData()
  const [isAdding, setIsAdding] = useState(false)
  const [newCompany, setNewCompany] = useState('')
  const [newDateStr, setNewDateStr] = useState('')

  const interviews = data.interviews || []
  
  const upcoming = interviews.filter(i => i.status === 'Upcoming' && i.date >= Date.now() - 86400000).sort((a, b) => a.date - b.date)
  const past = interviews.filter(i => i.status !== 'Upcoming' || i.date < Date.now() - 86400000).sort((a, b) => b.date - a.date)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newCompany.trim() || !newDateStr) return
    
    const newInterview: Interview = {
      id: crypto.randomUUID(),
      company: newCompany.trim(),
      date: new Date(newDateStr).getTime(),
      status: 'Upcoming'
    }

    await updateData(prev => ({
      ...prev,
      interviews: [...(prev.interviews || []), newInterview]
    }))

    setNewCompany('')
    setNewDateStr('')
    setIsAdding(false)
  }

  async function handleDelete(id: string) {
    await updateData(prev => ({
      ...prev,
      interviews: (prev.interviews || []).filter(i => i.id !== id)
    }))
  }

  async function handleStatusToggle(id: string) {
    await updateData(prev => ({
      ...prev,
      interviews: (prev.interviews || []).map(i => {
        if (i.id === id) {
          return { ...i, status: i.status === 'Upcoming' ? 'Completed' : 'Upcoming' }
        }
        return i
      })
    }))
  }

  return (
    <div className="pb-10">
      <Topbar title="Interviews" streakCount={data.streak} />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Upcoming Interviews</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:brightness-110 transition-all shadow-sm"
        >
          {isAdding ? <span className="px-2">Cancel</span> : <><PlusIcon size={14} /> Schedule New</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl p-5 mb-6 flex items-end gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Company Name</label>
            <div className="relative">
              <BuildingIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input 
                type="text" 
                required
                value={newCompany}
                onChange={e => setNewCompany(e.target.value)}
                placeholder="e.g. Google"
                className="w-full bg-[var(--surface-input)] border border-[var(--border-default)] rounded-lg py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Interview Date</label>
            <div className="relative">
              <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input 
                type="date" 
                required
                value={newDateStr}
                onChange={e => setNewDateStr(e.target.value)}
                className="w-full bg-[var(--surface-input)] border border-[var(--border-default)] rounded-lg py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:brightness-110 transition-all shadow-sm">
            Save
          </button>
        </form>
      )}

      {upcoming.length === 0 && !isAdding ? (
        <div className="bg-[var(--surface-card)] border border-[var(--border-default)] border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center mb-8">
          <CalendarIcon size={32} className="text-[var(--text-tertiary)] mb-3" />
          <h3 className="text-sm font-medium text-[var(--text-primary)]">No upcoming interviews</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Keep tracking your progress and schedule your next big interview!</p>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-input)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--surface-raised)] transition-all"
          >
            <PlusIcon size={14} /> Schedule Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {upcoming.map(interview => (
            <InterviewCard 
              key={interview.id} 
              interview={interview} 
              onDelete={handleDelete}
              onToggleStatus={handleStatusToggle}
            />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-4">Past Interviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70 hover:opacity-100 transition-opacity">
            {past.map(interview => (
              <InterviewCard 
                key={interview.id} 
                interview={interview} 
                onDelete={handleDelete}
                onToggleStatus={handleStatusToggle}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function InterviewCard({ interview, onDelete, onToggleStatus }: { interview: Interview, onDelete: (id: string) => void, onToggleStatus: (id: string) => void }) {
  const daysLeft = Math.ceil((interview.date - Date.now()) / 86400000)
  const isPast = daysLeft < 0

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl p-5 relative group hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-input)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
            <BuildingIcon size={18} className="text-[var(--text-secondary)]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{interview.company}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CalendarIcon size={12} className="text-[var(--text-tertiary)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                {new Date(interview.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => onDelete(interview.id)}
          className="text-[var(--text-tertiary)] hover:text-[var(--danger)] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
        >
          <TrashIcon size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] mt-2">
        {isPast ? (
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[var(--surface-input)] text-[var(--text-secondary)]">
            Completed
          </span>
        ) : (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
            daysLeft <= 3 ? 'bg-[var(--danger-soft)] text-[var(--danger)]' : 
            daysLeft <= 7 ? 'bg-[var(--warning-soft)] text-[var(--warning)]' : 
            'bg-[var(--accent-soft)] text-[var(--accent)]'
          }`}>
            {daysLeft === 0 ? 'Today!' : `${daysLeft} days left`}
          </span>
        )}
        
        <label className="flex items-center gap-2 cursor-pointer group/toggle">
          <span className="text-[10px] uppercase font-medium text-[var(--text-tertiary)] group-hover/toggle:text-[var(--text-secondary)] transition-colors">Mark Done</span>
          <input 
            type="checkbox" 
            checked={interview.status === 'Completed' || isPast} 
            onChange={() => onToggleStatus(interview.id)}
            className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--accent)] focus:ring-[var(--accent)] bg-[var(--surface-input)] cursor-pointer" 
          />
        </label>
      </div>
    </div>
  )
}
