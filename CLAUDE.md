# Auto-SEO — Claude Code Guide

## Project Overview

**Auto-SEO** is an automated SEO optimization platform that uses OpenAI to analyze, generate, and optimize content for search engines.

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **AI:** OpenAI API (GPT models for content generation/analysis)
- **State Management:** TanStack Query (server state) + React Context (local state)
- **Routing:** React Router v6

## Commit Rules

- **ONE change = ONE commit = ONE push**
- Write outcome-focused commit messages in present tense
  - Good: `add keyword density analyzer to dashboard`
  - Bad: `Updated files and added some features`
- **No `Co-Authored-By` trailers**
- **Always `git pull` before pushing**
- Never force push. Never reset --hard on shared branches.

## Task Tag Pipelines

Tags in TASKS.md control how tasks are executed:

| Tag | Pipeline |
|-----|----------|
| `[AUTO]` | Direct implementation → build check → commit → push |
| `[PLAN]` | 2-3 Explore agents → synthesize → Plan agent review → implement → build |
| `[TEST]` | Build → dev server → Playwright test → QA review → commit |
| `[AUTO-DB]` | Write to SUPABASE.md via lovable-handoff → notify user |
| `[BLOCKED]` | Skip entirely |

Combined tags (e.g., `[PLAN,TEST]`) run pipelines sequentially.

## Autonomous Mode Rules

When running `/batch`:
- Process tasks in TASKS.md order
- ONE task = ONE commit = ONE push
- Stop if uncertain or error persists after 2 fix attempts
- **Never** auto-approve: auth changes, payment logic, security changes, new dependencies
- Skip `[BLOCKED]` tasks entirely
- `[AUTO-DB]` tasks: write to SUPABASE.md, notify user, move on

## Supabase Sync Workflow

1. Claude Code identifies needed DB changes
2. Writes structured description to `SUPABASE.md` (Pending section)
3. User applies changes via Supabase Dashboard or migrations
4. After migration runs, verify in `supabase/migrations/`
5. Move completed items to "Completed" section in SUPABASE.md

**Never write raw SQL migrations directly.** Always document in SUPABASE.md first.

## Architecture

```
src/
├── components/     # Reusable UI components
├── pages/          # Route-level page components
├── hooks/          # Custom React hooks
├── lib/            # Utilities, API clients, helpers
├── integrations/   # Supabase client, OpenAI client
├── contexts/       # React context providers
├── types/          # TypeScript type definitions
└── styles/         # Global styles
```

## Coding Standards

- **Components:** PascalCase (`KeywordAnalyzer.tsx`)
- **Hooks:** camelCase with `use` prefix (`useKeywordData.ts`)
- **Utilities:** kebab-case (`seo-helpers.ts`)
- **Keep components under 150 lines** — extract sub-components when needed
- **Import order:** React → third-party → local components → hooks → utils → types

### TypeScript
- Let TypeScript infer when possible — don't over-annotate
- Use `interface` for object shapes, `type` for unions/intersections
- Never use `any` — use accurate types
- Use `async`/`await` over raw promises

### UI
- Use shadcn/ui + Radix primitives
- Mobile-responsive with Tailwind
- Event handlers: `handle*` for internal, `on*` for props

## API Keys

- **OpenAI:** Stored in `.env` as `VITE_OPENAI_API_KEY` (or via Supabase Edge Functions for server-side calls)
- **Supabase:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`

## Playwright Auth

Test credentials stored in `creds.txt` (gitignored).
Dev server runs at `http://localhost:5173`.

## Available Commands

- `/batch` — Run autonomous batch mode on TASKS.md
- `/tasks` — Quick status overview of all tasks

## Dev Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (lint + type-check + build)
npm run lint         # ESLint check
npm run preview      # Preview production build
npx vitest run       # Run tests
```
