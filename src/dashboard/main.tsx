import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

const originalWarn = console.warn
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('The width(') && args[0].includes('height(')) return
  originalWarn(...args)
}

import '../styles/globals.css'
import { DashboardLayout } from './DashboardLayout'
import { Overview } from './pages/Overview'
import { History } from './pages/History'
import { Review } from './pages/Review'
import { Settings } from './pages/Settings'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/history" element={<History />} />
        <Route path="/review" element={<Review />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </HashRouter>
)
