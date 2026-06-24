import { useState } from 'react'
import { SaveIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { useSettings } from '../../hooks/useStorage'
import { generateInsight } from '../../lib/claude'
import { useStorageData } from '../../hooks/useStorage'

export function Settings() {
  const { settings, updateSettings } = useSettings()
  const { data, updateData } = useStorageData()
  const [notionKey, setNotionKey] = useState(settings.notionApiKey)
  const [notionDb, setNotionDb] = useState(settings.notionDatabaseId)
  const [claudeKey, setClaudeKey] = useState(settings.claudeApiKey)
  const [showKeys, setShowKeys] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [generatingInsight, setGeneratingInsight] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateSettings(() => ({
      notionApiKey: notionKey,
      notionDatabaseId: notionDb,
      claudeApiKey: claudeKey,
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
    if (window.confirm('Reset all data? This cannot be undone.')) {
      await updateData(() => ({
        submissions: [],
        problems: {},
        streak: 0,
        lastSubmissionDate: '',
        totalSolved: 0,
        insight: null,
        pendingQueue: [],
        reviewQueue: [],
      }))
    }
  }

  const InputField = ({
    label,
    value,
    onChange,
    placeholder,
    isPassword,
  }: {
    label: string
    value: string
    onChange: (v: string) => void
    placeholder: string
    isPassword?: boolean
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !showKeys ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 pr-10"
        />
      </div>
    </div>
  )

  const needsSetup = !notionKey && !notionDb

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {needsSetup && (
        <div className="max-w-lg mb-8 bg-indigo-900/20 border border-indigo-700/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-indigo-300 mb-3">Setup Guide</h2>
          <ol className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-3">
              <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-xs font-bold text-white">1</span>
              <span>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">notion.so/my-integrations</a> and create a new integration. Copy the API key.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-xs font-bold text-white">2</span>
              <span>Create a database with properties: <code className="text-indigo-300 bg-indigo-900/30 px-1 rounded">Name</code> (Title), <code className="text-indigo-300 bg-indigo-900/30 px-1 rounded">Slug</code> (Text), <code className="text-indigo-300 bg-indigo-900/30 px-1 rounded">Difficulty</code> (Select), <code className="text-indigo-300 bg-indigo-900/30 px-1 rounded">Status</code> (Select), <code className="text-indigo-300 bg-indigo-900/30 px-1 rounded">URL</code> (URL), <code className="text-indigo-300 bg-indigo-900/30 px-1 rounded">Last Attempted</code> (Date), <code className="text-indigo-300 bg-indigo-900/30 px-1 rounded">Attempt Count</code> (Number).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-xs font-bold text-white">3</span>
              <span>Share the database with your integration, then copy the Database ID from the URL.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-xs font-bold text-white">4</span>
              <span>Fill in the fields below and click <strong>Save Settings</strong>.</span>
            </li>
          </ol>
        </div>
      )}

      <div className="max-w-lg space-y-6">
        <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Notion Integration
          </h2>
          <div className="space-y-3">
            <InputField
              label="Notion API Key"
              value={notionKey}
              onChange={setNotionKey}
              placeholder="ntn_..."
              isPassword
            />
            <InputField
              label="Database ID"
              value={notionDb}
              onChange={setNotionDb}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              isPassword
            />
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            AI Insights
          </h2>
          <div className="space-y-3">
            <InputField
              label="Claude API Key"
              value={claudeKey}
              onChange={setClaudeKey}
              placeholder="sk-ant-..."
              isPassword
            />
            <button
              onClick={handleGenerateInsight}
              disabled={!settings.claudeApiKey || generatingInsight}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
            >
              {generatingInsight ? 'Generating...' : 'Generate AI Insight'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <SaveIcon size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="text-emerald-400 text-sm">Saved!</span>}
          <button
            onClick={() => setShowKeys(v => !v)}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title={showKeys ? 'Hide keys' : 'Show keys'}
          >
            {showKeys ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        </div>

        <div className="bg-red-900/10 rounded-xl p-5 border border-red-900/30">
          <h2 className="text-sm font-medium text-red-400 uppercase tracking-wider mb-2">
            Danger Zone
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            This will erase all local data including submissions, problems, and streaks.
          </p>
          <button
            onClick={handleResetAll}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  )
}
