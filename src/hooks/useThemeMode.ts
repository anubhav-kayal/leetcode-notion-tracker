import { useState, useEffect } from 'react'
import { useSettings } from './useStorage'

export function useThemeMode() {
  const { settings, updateSettings, loading } = useSettings()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (loading) return

    const root = document.documentElement
    
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      root.classList.remove('light', 'dark')
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.add(systemTheme)
        setIsDark(systemTheme === 'dark')
      } else {
        root.classList.add(theme)
        setIsDark(theme === 'dark')
      }
    }

    applyTheme(settings.theme)

    // Listen for system theme changes if set to system
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme('system')
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [settings.theme, loading])

  const toggleDark = () => {
    updateSettings(prev => ({
      ...prev,
      theme: isDark ? 'light' : 'dark'
    }))
  }

  return { isDark, toggleDark }
}
