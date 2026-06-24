import { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ArrowRightIcon, CheckIcon, BookOpenIcon, KeyIcon, DatabaseIcon } from 'lucide-react'
import '../styles/globals.css'
import { useSettings } from '../hooks/useStorage'

type Step = 'welcome' | 'notion-key' | 'notion-db' | 'claude' | 'done'

function OnboardingApp() {
  const { settings, updateSettings } = useSettings()
  const [step, setStep] = useState<Step>('welcome')
  const [notionKey, setNotionKey] = useState('')
  const [notionDb, setNotionDb] = useState('')
  const [claudeKey, setClaudeKey] = useState('')

  async function saveAndNext() {
    await updateSettings(() => ({
      notionApiKey: notionKey || settings.notionApiKey,
      notionDatabaseId: notionDb || settings.notionDatabaseId,
      claudeApiKey: claudeKey || settings.claudeApiKey,
    }))
  }

  async function handleFinish() {
    await saveAndNext()
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') })
    window.close()
  }

  async function handleSkip() {
    await saveAndNext()
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') })
    window.close()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {step === 'welcome' && (
          <StepCard
            icon={<BookOpenIcon size={32} className="text-indigo-400" />}
            title="Welcome to LeetTrack"
            description="Automatically log your LeetCode submissions to Notion. Track streaks, get AI-powered insights, and never lose track of your progress."
            action={
              <button
                onClick={() => setStep('notion-key')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                Get Started <ArrowRightIcon size={16} />
              </button>
            }
          />
        )}

        {step === 'notion-key' && (
          <StepCard
            icon={<KeyIcon size={32} className="text-indigo-400" />}
            title="Step 1: Notion API Key"
            description="Go to https://www.notion.so/my-integrations, create a new integration, and paste the API key here."
            action={
              <div className="space-y-3">
                <input
                  type="password"
                  value={notionKey}
                  onChange={e => setNotionKey(e.target.value)}
                  placeholder="ntn_... (or paste your key)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => setStep('notion-db')}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Next <ArrowRightIcon size={16} />
                </button>
              </div>
            }
          />
        )}

        {step === 'notion-db' && (
          <StepCard
            icon={<DatabaseIcon size={32} className="text-indigo-400" />}
            title="Step 2: Database ID"
            description="Create a database in Notion with the required properties, share it with your integration, and paste the Database ID from the URL."
            action={
              <div className="space-y-3">
                <input
                  type="password"
                  value={notionDb}
                  onChange={e => setNotionDb(e.target.value)}
                  placeholder="Database ID"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => setStep('claude')}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Next <ArrowRightIcon size={16} />
                </button>
              </div>
            }
          />
        )}

        {step === 'claude' && (
          <StepCard
            icon={<KeyIcon size={32} className="text-purple-400" />}
            title="Step 3: AI Insights (Optional)"
            description="Add a Claude API key for AI-powered analysis of your submission patterns. This is optional."
            action={
              <div className="space-y-3">
                <input
                  type="password"
                  value={claudeKey}
                  onChange={e => setClaudeKey(e.target.value)}
                  placeholder="sk-ant-... (optional)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleFinish}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Complete Setup <CheckIcon size={16} />
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Skip & open dashboard
                </button>
              </div>
            }
          />
        )}

        {step === 'done' && null}
      </div>
    </div>
  )
}

function StepCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-8 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<OnboardingApp />)
