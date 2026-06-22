# LeetTrack — Auto-log LeetCode to Notion

A Chrome Extension that automatically detects LeetCode submissions, logs them to your Notion database, tracks streaks, and provides AI-powered insights.

## Features

- **Auto-detection** — Intercepts submissions in real-time via fetch interception + MutationObserver fallback
- **Notion Integration** — Creates/updates Notion pages with submission details, code blocks, and results
- **Deduplication** — Groups all attempts under a single problem entry; tracks attempt count
- **Streaks** — GitHub-style streak tracking with visual badges
- **Dashboard** — Full React dashboard with heatmap, history table, trend charts, and spaced repetition queue
- **AI Insights** — Optional Claude-powered analysis of your submission patterns
- **Privacy-first** — No telemetry; data goes only to your Notion and optionally Claude (opt-in)

## Tech Stack

- **Extension**: Manifest V3
- **Frontend**: React 18 + TypeScript
- **Build**: Vite + @crxjs/vite-plugin
- **Styling**: Tailwind CSS v3
- **Charts**: Recharts + custom SVG heatmap
- **Icons**: Lucide React
- **Storage**: chrome.storage.sync (settings), chrome.storage.local (data)

## Getting Started

### Prerequisites

- Node.js 18+
- Chrome browser
- A Notion account with API integration access

### Installation

```bash
git clone https://github.com/your-username/leetcode-notion-tracker.git
cd leetcode-notion-tracker
npm install
npm run build
```

Then load the `dist/` folder in Chrome at `chrome://extensions` with Developer mode enabled.

### Required Notion Setup

1. Go to https://www.notion.so/my-integrations → New integration → copy token
2. Create a database with these properties:
   - Name (Title), Slug (Text), Difficulty (Select: Easy/Medium/Hard)
   - Status (Select: Attempted/Solved), URL (URL)
   - Last Attempted (Date), Attempt Count (Number)
3. Share the database with your integration
4. Copy the Database ID from the URL

## Project Structure

```
src/
├── background/       # Service worker — Notion API, streak, AI
├── content/          # LeetCode page — submission detection
├── popup/            # Extension popup — glance stats
├── dashboard/        # Full dashboard tab — heatmap, history, review
├── onboarding/       # First-run setup flow
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks (storage, settings)
├── lib/              # Core logic (notion, claude, streak, types)
└── styles/           # Tailwind configuration
```

## Development

```bash
npm run dev     # HMR for popup/dashboard (requires manual reload for bg/content)
npm run build   # Production build into dist/
```

## License

MIT
