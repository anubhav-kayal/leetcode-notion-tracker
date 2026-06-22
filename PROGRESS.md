# LeetTrack — Build Progress

## Day 1 — Project Scaffold ✅

### Completed
- [x] Vite + React-TS project created
- [x] Dependencies installed:
  - Runtime: React 18, recharts, lucide-react, react-router-dom
  - Dev: @crxjs/vite-plugin, tailwindcss@3, postcss, autoprefixer, @types/chrome
- [x] Config files:
  - `vite.config.ts` — with @crxjs/vite-plugin (manifest inline)
  - `tailwind.config.js` — scans `./src/**/*.{ts,tsx,html}`
  - `postcss.config.js` — tailwind + autoprefixer
  - `tsconfig.json` — references `tsconfig.app.json` + `tsconfig.node.json`
  - `tsconfig.app.json` — updated with `chrome` types
- [x] Directory structure created (all source dirs)
- [x] `src/styles/globals.css` — Tailwind directives
- [x] `manifest.json` inlined in vite.config.ts — MV3, all permissions, content script with `world: "MAIN"`
- [x] Icon PNGs generated (16×16, 48×48, 128×128)
- [x] Placeholder stubs:
  - `src/popup/index.html` + `main.tsx` — popup entry
  - `src/background/index.ts` — service worker stub
  - `src/content/index.ts` — content script stub
- [x] Build succeeds (`npm run build`)
- [x] Git repo initialized, initial commit made
- [x] README.md with project overview

### Upcoming Days

| Day | Focus |
|-----|-------|
| Day 2 | `src/lib/types.ts` + Language mapping + `src/content/index.ts` (submission detection) |
| Day 3 | `src/background/index.ts` (Notion API calls, message listener, handleSubmission) |
| Day 4 | `src/lib/notion.ts` + `src/lib/streak.ts` + `src/lib/claude.ts` |
| Day 5 | Popup UI (`Popup.tsx`, full design with stats, streak, review nudge) |
| Day 6 | Dashboard — Overview, History, Review, Settings pages |
| Day 7 | Onboarding, components (Heatmap, TrendChart, ReviewCard), polish, E2E test |
