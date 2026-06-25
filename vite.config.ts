import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'

const manifest = {
  manifest_version: 3,
  name: 'LeetTrack — Auto-log to Notion',
  version: '1.0.0',
  description:
    'Automatically logs your LeetCode submissions to Notion with deduplication, streaks, and spaced repetition.',
  permissions: ['storage', 'alarms', 'notifications', 'scripting', 'tabs'],
  host_permissions: [
    'https://leetcode.com/*',
    'https://api.notion.com/*',
    'https://api.anthropic.com/*',
  ],
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://leetcode.com/problems/*'],
      js: ['src/content/isolated.tsx'],
      run_at: 'document_start',
    },
    {
      matches: ['https://leetcode.com/problems/*'],
      js: ['src/content/main-world.ts'],
      run_at: 'document_start',
      world: 'MAIN',
    },
  ],
  options_ui: {
    page: 'src/dashboard/index.html',
    open_in_tab: true,
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      '16': 'public/icons/icon16.png',
      '48': 'public/icons/icon48.png',
      '128': 'public/icons/icon128.png',
    },
  },
  icons: {
    '16': 'public/icons/icon16.png',
    '48': 'public/icons/icon48.png',
    '128': 'public/icons/icon128.png',
  },
}

export default defineConfig({
  plugins: [react(), crx({ manifest })],
})
