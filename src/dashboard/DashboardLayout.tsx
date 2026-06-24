import { NavLink, Outlet } from 'react-router-dom'
import { ChartBarIcon, ClockIcon, HistoryIcon, SettingsIcon } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: ChartBarIcon, label: 'Overview' },
  { to: '/history', icon: HistoryIcon, label: 'History' },
  { to: '/review', icon: ClockIcon, label: 'Review' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
]

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <nav className="w-56 bg-gray-900/50 border-r border-gray-800 p-4 flex flex-col gap-1 shrink-0">
        <div className="flex items-center gap-2 px-3 py-4 mb-4">
          <span className="text-indigo-400 font-bold text-lg">LeetTrack</span>
        </div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
