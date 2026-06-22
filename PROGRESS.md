# LeetTrack — Build Progress

## Commits

| Commit | Message |
|--------|---------|
| `d4f0905` | chore: scaffold project with Vite, React, Tailwind, and CRXJS |
| `524a39e` | feat: define shared TypeScript types for submissions, settings, and storage |
| `91a260e` | feat: add LeetCode to Notion language mapping utility |
| `4eb9ed6` | feat: implement LeetCode submission detection with fetch interception and MutationObserver |

## Day 1 — Project Scaffold ✅

- [x] Vite + React-TS project created
- [x] Dependencies installed (recharts, lucide-react, react-router-dom, @crxjs/vite-plugin, tailwindcss, @types/chrome)
- [x] Config files: vite.config.ts, tailwind.config.js, postcss.config.js, tsconfigs
- [x] Directory structure created
- [x] globals.css with Tailwind directives
- [x] MV3 manifest with `world: "MAIN"` content script
- [x] Icon PNGs generated
- [x] Popup stub with React entry
- [x] Build verified
- [x] Git repo initialized + pushed to GitHub

## Day 2 — Types + Language Map + Content Detection ✅

- [x] `src/lib/types.ts` — all shared TypeScript types
  - `Submission`, `ProblemRecord`, `Settings`, `StorageData` interfaces
  - `Difficulty`, `SubmissionResult` union types
  - `NotionAuthError`, `NotionNotFoundError` error classes
- [x] `src/lib/language-map.ts` — LeetCode lang → Notion lang mapping
  - Covers 20 languages with `toNotionLanguage()` helper
  - Falls back to `plain text` for unknown
- [x] `src/content/index.ts` — submission detection
  - Primary: `window.fetch` override intercepting `/submit/` and GraphQL
  - Extracts result, language, runtime, memory from response
  - Scrapes problem title, slug, difficulty from DOM
  - Fallback: MutationObserver watching for result containers
  - Deduplication via `Set<string>` with 5-second window
  - Sends structured `SUBMISSION` message to background

### Upcoming

| Day | Focus |
|-----|-------|
| Day 3 | `src/background/index.ts` (message listener, handleSubmission, Notion sync) + `src/lib/notion.ts` |
| Day 4 | `src/lib/streak.ts` + `src/lib/claude.ts` + `src/lib/spaced-repetition.ts` |
| Day 5 | Popup UI (Popup.tsx, full design with stats, streak, review nudge) |
| Day 6 | Dashboard — Overview, History, Review, Settings pages |
| Day 7 | Onboarding, components (Heatmap, TrendChart, ReviewCard), polish, E2E test |
