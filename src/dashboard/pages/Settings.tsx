import { useState, useEffect } from 'react'
import { EyeIcon, EyeOffIcon, MonitorIcon, SunIcon, MoonIcon, DatabaseIcon, BrainIcon, CalendarIcon, AlertTriangleIcon } from 'lucide-react'
import { useSettings, useStorageData } from '../../hooks/useStorage'
import { generateInsight } from '../../lib/claude'
import { TOP_COMPANIES, type StorageData } from '../../lib/types'
import type { Settings as SettingsType } from '../../lib/types'

function InputField({
  value,
  onChange,
  placeholder,
  isPassword,
  showValue,
  type = 'text'
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  isPassword?: boolean
  showValue?: boolean
  type?: string
}) {
  return (
    <input
      type={isPassword && !showValue ? 'password' : type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="text-sm bg-[var(--surface-input)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-[var(--text-primary)] w-64 outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-1 placeholder:text-[var(--text-tertiary)] transition-all"
    />
  )
}

export function Settings() {
  const { settings, loading, updateSettings } = useSettings()
  const { data, updateData } = useStorageData()
  const [notionKey, setNotionKey] = useState(settings.notionApiKey)
  const [notionDb, setNotionDb] = useState(settings.notionDatabaseId)
  const [claudeKey, setClaudeKey] = useState(settings.claudeApiKey)
  const [theme, setTheme] = useState<SettingsType['theme']>(settings.theme)
  const [targetCompany, setTargetCompany] = useState(settings.targetCompany || '')
  const [showKeys, setShowKeys] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [generatingInsight, setGeneratingInsight] = useState(false)

  useEffect(() => {
    if (!loading) {
      setNotionKey(settings.notionApiKey)
      setNotionDb(settings.notionDatabaseId)
      setClaudeKey(settings.claudeApiKey)
      setTheme(settings.theme || 'system')
      setTargetCompany(settings.targetCompany || '')
    }
  }, [settings, loading])

  async function handleSave() {
    setSaving(true)
    
    let cleanDbId = notionDb.trim()
    const match = cleanDbId.match(/[a-f0-9]{32}/i)
    if (match) {
      cleanDbId = match[0]
      setNotionDb(cleanDbId)
    }

    await updateSettings(() => ({
      notionApiKey: notionKey.trim(),
      notionDatabaseId: cleanDbId,
      claudeApiKey: claudeKey.trim(),
      theme,
      targetCompany: targetCompany.trim() || undefined,
    }))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleGenerateInsight() {
    if (!settings.claudeApiKey) return
    setGeneratingInsight(true)
    try {
      const insight = await generateInsight(
        {
          submissions: data.submissions,
          problems: Object.values(data.problems),
          streak: data.streak,
          totalSolved: data.totalSolved,
        },
        settings.claudeApiKey
      )
      await updateData(prev => ({ ...prev, insight }))
    } catch (err) {
      console.error('Failed to generate insight:', err)
    }
    setGeneratingInsight(false)
  }

  async function handleResetAll() {
    if (window.confirm('Are you absolutely sure you want to reset all data? This cannot be undone.')) {
      const emptyData: StorageData = {
        submissions: [],
        problems: {},
        streak: 0,
        lastSubmissionDate: '',
        totalSolved: 0,
        insight: null,
        pendingQueue: [],
        reviewQueue: [],
        companyList: [...TOP_COMPANIES],
        interviews: [],
      }
      await updateData(() => emptyData)
    }
  }

  return (
    <div className="max-w-2xl pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-[var(--text-primary)] tracking-tight">Settings</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowKeys(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {showKeys ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
            {showKeys ? 'Hide keys' : 'Show keys'}
          </button>
          {saved && <span className="text-xs text-[var(--success)] font-medium">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-[var(--accent)] rounded-lg px-4 py-2 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl mb-4">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
          <DatabaseIcon size={18} className="text-[var(--text-tertiary)]" />
          <h2 className="text-sm font-medium text-[var(--text-primary)]">Notion Integration</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-subtle)] last:border-0">
          <div>
            <div className="text-sm text-[var(--text-primary)]">Notion API Key</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Used to authenticate with your Notion workspace</div>
          </div>
          <InputField
            value={notionKey}
            onChange={setNotionKey}
            placeholder="ntn_..."
            isPassword
            showValue={showKeys}
          />
        </div>
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-subtle)] last:border-0">
          <div>
            <div className="text-sm text-[var(--text-primary)]">Database ID</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">The ID of the table where submissions are logged</div>
          </div>
          <InputField
            value={notionDb}
            onChange={setNotionDb}
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            isPassword
            showValue={showKeys}
          />
        </div>
      </div>

      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl mb-4">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
          <MonitorIcon size={18} className="text-[var(--text-tertiary)]" />
          <h2 className="text-sm font-medium text-[var(--text-primary)]">Preferences</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-subtle)] last:border-0">
          <div>
            <div className="text-sm text-[var(--text-primary)]">Theme</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Choose your preferred appearance</div>
          </div>
          <div className="flex bg-[var(--surface-input)] p-1 rounded-lg">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  theme === t
                    ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t === 'light' ? <SunIcon size={14} /> : t === 'dark' ? <MoonIcon size={14} /> : <MonitorIcon size={14} />}
                <span className="capitalize ml-0.5">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl mb-4">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
          <CalendarIcon size={18} className="text-[var(--text-tertiary)]" />
          <h2 className="text-sm font-medium text-[var(--text-primary)]">Goals & Tracking</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-subtle)] last:border-0">
          <div>
            <div className="text-sm text-[var(--text-primary)]">Target Company</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Focus your practice on a specific employer</div>
          </div>
          <InputField
            value={targetCompany}
            onChange={setTargetCompany}
            placeholder="e.g. Google, Meta"
          />
        </div>
      </div>

      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-xl mb-4">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
          <BrainIcon size={18} className="text-[var(--text-tertiary)]" />
          <h2 className="text-sm font-medium text-[var(--text-primary)]">AI Insights</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-subtle)] last:border-0">
          <div>
            <div className="text-sm text-[var(--text-primary)]">Claude API Key</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Required to generate personalized insights</div>
          </div>
          <InputField
            value={claudeKey}
            onChange={setClaudeKey}
            placeholder="sk-ant-..."
            isPassword
            showValue={showKeys}
          />
        </div>
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-subtle)] last:border-0">
          <div>
            <div className="text-sm text-[var(--text-primary)]">Generate Insight</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Analyze your recent submissions for patterns</div>
          </div>
          <button
            onClick={handleGenerateInsight}
            disabled={!settings.claudeApiKey || generatingInsight}
            className="text-xs font-medium text-[var(--accent)] border border-[var(--accent-border)] bg-[var(--accent-soft)] rounded-lg px-3 py-1.5 cursor-pointer hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingInsight ? 'Generating...' : 'Generate manually'}
          </button>
        </div>
      </div>

      <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-xl mb-4">
        <div className="px-5 py-4 border-b border-[var(--danger)]/10 flex items-center gap-3">
          <AlertTriangleIcon size={18} className="text-[var(--danger)]" />
          <h2 className="text-sm font-medium text-[var(--danger)]">Danger Zone</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--text-primary)]">Clear all data</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Reset all local submissions, problems, and streaks</div>
          </div>
          <button
            onClick={handleResetAll}
            className="text-xs text-[var(--danger)] border border-[var(--danger)]/30 rounded-lg px-3 py-1.5 hover:bg-[var(--danger)]/10 transition-colors"
          >
            Clear all data
          </button>
        </div>
      </div>

    </div>
  )
}
