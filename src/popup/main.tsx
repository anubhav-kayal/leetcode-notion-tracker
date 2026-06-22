import React from 'react'
import ReactDOM from 'react-dom/client'
import '../styles/globals.css'

const App: React.FC = () => {
  return (
    <div className="w-[360px] bg-gray-950 text-white p-4">
      <h1 className="text-lg font-bold">LeetTrack</h1>
      <p className="text-gray-400 text-sm mt-1">Loading...</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
