# Auto-SEO

AI-powered SEO optimization platform that analyzes, generates, and optimizes content for search engines.

**Live:** [auto-seo-eight.vercel.app](https://auto-seo-eight.vercel.app)

## Features

- **Dashboard** — Overview stats, recent analyses, quick actions
- **Projects** — Organize SEO work by website/project
- **Keyword Tracker** — Track keywords with volume, difficulty, and intent
- **Content Analyzer** — AI-powered SEO scoring across 6 categories
- **Content Generator** — Generate SEO-optimized articles with meta tags
- **Competitor Analysis** — Side-by-side competitor comparison with strengths/weaknesses
- **Backlink Tracker** — Monitor backlinks with active/broken status
- **Site Audit** — Technical SEO audit with categorized issues and severity
- **Content Calendar** — Plan, schedule, and track content with status workflows

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (Postgres + Auth + RLS)
- **AI:** OpenAI GPT-4o-mini
- **State:** TanStack Query + React Context
- **Routing:** React Router v6
- **Deployment:** Vercel

## Getting Started

```bash
git clone https://github.com/jiliangarette/auto-seo.git
cd auto-seo
npm install
```

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run preview` | Preview production build |

## License

MIT
