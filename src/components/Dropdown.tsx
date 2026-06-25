import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon } from 'lucide-react'

interface DropdownProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Dropdown({ options, value, onChange, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-500/50 shadow-sm transition-all"
      >
        <span className="mr-3">{selectedOption?.label}</span>
        <ChevronDownIcon size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full min-w-[160px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden py-1.5">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors"
            >
              <span className={`truncate ${value === option.value ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {option.label}
              </span>
              {value === option.value && (
                <CheckIcon size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 ml-3" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
