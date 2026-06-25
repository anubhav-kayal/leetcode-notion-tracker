import { NavLink, Outlet } from 'react-router-dom'
import { ChartBarIcon, ClockIcon, HistoryIcon, SettingsIcon, BuildingIcon, CodeIcon, MoreHorizontalIcon, CalendarIcon } from 'lucide-react'
import { useThemeMode } from '../hooks/useThemeMode'

const NAV_ITEMS = [
  { to: '/', icon: ChartBarIcon, label: 'Overview' },
  { to: '/history', icon: HistoryIcon, label: 'History' },
  { to: '/interviews', icon: CalendarIcon, label: 'Interviews' },
  { to: '/companies', icon: BuildingIcon, label: 'Companies' },
  { to: '/review', icon: ClockIcon, label: 'Review' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
]

export function DashboardLayout() {
  useThemeMode()

  return (
    <div className="bg-[var(--surface-base)] min-h-screen grid grid-cols-[208px_1fr]">
      <nav className="h-screen sticky top-0 flex flex-col bg-[var(--surface-raised)] border-r border-[var(--border-default)]">
        <div className="px-5 pt-6 pb-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <CodeIcon size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-medium text-[var(--text-primary)]">LeetTrack</span>
        </div>
        
        <div className="flex-1 px-3 pt-2">
          <div className="text-[10px] font-medium tracking-[0.08em] text-[var(--text-tertiary)] px-2 mb-2 uppercase">
            Navigate
          </div>
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'text-[var(--accent)] bg-[var(--accent-soft)] border-l-2 border-[var(--accent)] -ml-px rounded-l-none'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-input)]'
                  }`
                }
              >
                <item.icon size={16} className="mr-0.5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="mt-auto px-4 py-4 border-t border-[var(--border-subtle)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-medium flex items-center justify-center shrink-0">
            Me
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium text-[var(--text-primary)] truncate">User</span>
            <span className="text-[11px] text-[var(--text-tertiary)] truncate">Free Plan</span>
          </div>
          <button className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] shrink-0 transition-colors">
            <MoreHorizontalIcon size={16} />
          </button>
        </div>
      </nav>
      <main className="px-8 py-7 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
