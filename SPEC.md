# Auto-SEO — Project Specification

## Vision
An AI-powered SEO optimization platform that helps users analyze, generate, and optimize web content for search engines using OpenAI.

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 + shadcn/ui (dark theme)
- **Database:** Supabase (Postgres + Auth + RLS)
- **AI:** OpenAI API (GPT-4o for analysis/generation)
- **State:** TanStack Query (server) + React Context (local)
- **Routing:** React Router v7

## Modules (build order)

### 1. Auth Module
- [x] Supabase client setup
- [ ] Login page (email/password via Supabase Auth)
- [ ] Signup page
- [ ] Protected route wrapper
- [ ] Auth state in navbar (user email, sign out button)

### 2. Projects Module
- [ ] DB: `projects` table (id, user_id, name, url, created_at)
- [ ] Create project form (name + URL)
- [ ] Projects list page
- [ ] Project detail page (shell)

### 3. Keyword Tracker Module
- [ ] DB: `keywords` table (id, project_id, keyword, position, search_volume, created_at)
- [ ] Add keywords form
- [ ] Keywords table with sorting
- [ ] Keyword position tracking (manual entry for now)

### 4. Content Analyzer Module
- [ ] DB: `analyses` table (id, project_id, url, score, suggestions, created_at)
- [ ] URL input → fetch page content (or paste HTML)
- [ ] OpenAI call: analyze content for SEO (title, meta, headings, keyword density, readability)
- [ ] Display analysis results with score + suggestions
- [ ] Save analysis to DB

### 5. Content Generator Module
- [ ] Input: topic, target keywords, tone, length
- [ ] OpenAI call: generate SEO-optimized content
- [ ] Preview generated content with SEO score
- [ ] Copy to clipboard / export

### 6. Dashboard Module
- [ ] Project selector
- [ ] Stats cards (projects count, keywords tracked, analyses run, avg SEO score)
- [ ] Recent analyses list
- [ ] Quick actions (new project, run analysis, generate content)

## Database Schema (Supabase)

```sql
-- profiles (auto-created on signup)
create table profiles (
  id uuid references auth.users primary key,
  email text,
  created_at timestamptz default now()
);

-- projects
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  url text,
  created_at timestamptz default now()
);

-- keywords
create table keywords (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  keyword text not null,
  position integer,
  search_volume integer,
  created_at timestamptz default now()
);

-- analyses
create table analyses (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  url text not null,
  score integer,
  suggestions jsonb,
  raw_response jsonb,
  created_at timestamptz default now()
);
```

RLS: All tables filtered by `auth.uid() = user_id` (or via project ownership for keywords/analyses).

## Design Direction
- Dark theme by default
- Clean, minimal dashboard aesthetic
- Card-based layouts
- No flashy gradients — professional and focused
