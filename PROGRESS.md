# LeetTrack — Build Progress

## Commits

| Commit | Message |
|--------|---------|
| `d4f0905` | chore: scaffold project with Vite, React, Tailwind, and CRXJS |
| `524a39e` | feat: define shared TypeScript types for submissions, settings, and storage |
| `91a260e` | feat: add LeetCode to Notion language mapping utility |
| `4eb9ed6` | feat: implement LeetCode submission detection with fetch interception and MutationObserver |
| `1b426fe` | docs: update PROGRESS.md with Day 2 completion and commit history |
| `127159e` | feat: add Notion API client and background service worker with sync, retry, and streak tracking |
| `de97a00` | feat: add streak tracking, Claude AI insights, and spaced repetition utilities |
| `f6dd46b` | feat: add useStorage and useSettings hooks for chrome.storage access |
| `40d98fe` | feat: implement popup UI with stats, streak display, AI insight, and review nudge |
| `cc6a5ee` | feat: add Heatmap, TrendChart, and ReviewCard shared components |
| `461aca2` | feat: add dashboard with Overview, History, Review, and Settings pages |
| `5aea17e` | feat: add onboarding flow with guided setup for Notion and Claude API keys |
| `77a5f04` | feat: wire up dashboard as options page, add onboarding banner, and first-run setup flow |

## Project Structure

```
src/
├── background/       # Service worker — Notion API, streak, AI, retry
├── content/          # LeetCode page — fetch interception, MutationObserver
├── popup/            # Extension popup — glance stats, streak, recent activity
├── dashboard/        # Full dashboard — Overview, History, Review, Settings
├── components/       # Reusable UI — Heatmap, TrendChart, ReviewCard
├── hooks/            # useStorage, useSettings — typed chrome.storage access
├── lib/              # Core — types, notion client, streak, claude, spaced-repetition
└── styles/           # Tailwind CSS config
```

## What's Built

### Core Infrastructure
- [x] Vite + React-TS + Tailwind + CRXJS scaffold
- [x] MV3 manifest with content script (`world: MAIN`), background service worker, popup
- [x] Shared TypeScript types (`Submission`, `ProblemRecord`, `Settings`, `StorageData`)
- [x] LeetCode → Notion language mapping (20 languages)

### Submission Detection
- [x] `window.fetch` override intercepting `/submit/` and GraphQL `/graphql`
- [x] Extracts result, language, runtime, memory, code from response
- [x] DOM scraping for problem title, slug, difficulty
- [x] MutationObserver fallback for result containers
- [x] Deduplication via `Set<string>` with 5-second window

### Notion Integration
- [x] Full API client — `findProblemBySlug`, `createProblemPage`, `updateProblemPage`
- [x] `syncSubmission()` — upsert (update existing or create new)
- [x] Paginated `queryDatabaseProblems()`
- [x] Auth error handling (`NotionAuthError`, `NotionNotFoundError`)
- [x] Background service worker — process, deduplicate, sync, retry with alarms

### Library Utilities
- [x] `streak.ts` — current streak, longest streak, `calculateStreak()`
- [x] `claude.ts` — Claude API insight generation with structured prompts
- [x] `spaced-repetition.ts` — review queue with priority scoring

### Hooks
- [x] `useStorageData()` — typed reactive hook for `chrome.storage.local`
- [x] `useSettings()` — typed reactive hook for `chrome.storage.sync`

### Popup UI
- [x] 3-card stat display: Streak, Solved, Review queue
- [x] AI Insight panel (when available)
- [x] Recent activity list (last 5 submissions)
- [x] Navigation to dashboard and settings
- [x] Setup warning banner when Notion not configured

### Dashboard (options page, opens in tab)
- [x] **Overview** — stat grid, GitHub-style heatmap, 30-day trend chart
- [x] **History** — sortable/filterable table with search, difficulty/status filters
- [x] **Review** — spaced repetition queue with dismiss, refresh, difficulty badges
- [x] **Settings** — Notion API key, DB ID, Claude key, save/show/hide, reset all data
- [x] Onboarding banner with step-by-step setup guide

### Components
- [x] `Heatmap` — GitHub-style contribution grid (26 weeks) with color intensity
- [x] `TrendChart` — 30-day line chart (total/accepted) using Recharts
- [x] `ReviewCard` — card with difficulty color, status, time since, dismiss, LeetCode link

### Integration
- [x] Dashboard wired as `options_ui` with `open_in_tab: true`
- [x] First-run opens dashboard automatically on install
- [x] Popup opens dashboard via `chrome.runtime.openOptionsPage()`

## Building

```bash
npm run build    # tsc -b && vite build → output in dist/
npm run dev      # HMR for popup/dashboard
```

Load `dist/` in Chrome at `chrome://extensions` with Developer mode.
