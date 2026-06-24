import { useState, useEffect, useCallback } from 'react'
import type { StorageData, Settings } from '../lib/types'

const DEFAULT_DATA: StorageData = {
  submissions: [],
  problems: {},
  streak: 0,
  lastSubmissionDate: '',
  totalSolved: 0,
  insight: null,
  pendingQueue: [],
  reviewQueue: [],
}

const DEFAULT_SETTINGS: Settings = {
  notionApiKey: '',
  notionDatabaseId: '',
  claudeApiKey: '',
}

export function useStorageData() {
  const [data, setData] = useState<StorageData>(DEFAULT_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chrome.storage.local.get('leetrackData').then(result => {
      if (result.leetrackData) {
        setData({ ...DEFAULT_DATA, ...result.leetrackData })
      }
      setLoading(false)
    })

    const handler = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.leetrackData) {
        setData({ ...DEFAULT_DATA, ...changes.leetrackData.newValue })
      }
    }
    chrome.storage.local.onChanged.addListener(handler)
    return () => chrome.storage.local.onChanged.removeListener(handler)
  }, [])

  const updateData = useCallback(async (updater: (prev: StorageData) => StorageData) => {
    const result = await chrome.storage.local.get('leetrackData')
    const current = { ...DEFAULT_DATA, ...(result.leetrackData ?? {}) }
    const next = updater(current)
    await chrome.storage.local.set({ leetrackData: next })
    setData(next)
  }, [])

  return { data, loading, updateData }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chrome.storage.sync.get('leetrackSettings').then(result => {
      if (result.leetrackSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.leetrackSettings })
      }
      setLoading(false)
    })

    const handler = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.leetrackSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...changes.leetrackSettings.newValue })
      }
    }
    chrome.storage.sync.onChanged.addListener(handler)
    return () => chrome.storage.sync.onChanged.removeListener(handler)
  }, [])

  const updateSettings = useCallback(async (updater: (prev: Settings) => Settings) => {
    const result = await chrome.storage.sync.get('leetrackSettings')
    const current = { ...DEFAULT_SETTINGS, ...(result.leetrackSettings ?? {}) }
    const next = updater(current)
    await chrome.storage.sync.set({ leetrackSettings: next })
    setSettings(next)
  }, [])

  return { settings, loading, updateSettings }
}
