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

## Modules — Phase 1 (DONE)

### 1. Auth Module ✅
### 2. Projects Module ✅
### 3. Keyword Tracker Module ✅
### 4. Content Analyzer Module ✅
### 5. Content Generator Module ✅
### 6. Dashboard Module ✅

## Modules — Phase 2 (build these next)

### 7. Competitor Analysis
- DB: `competitors` table (id, project_id, url, name, created_at)
- Add competitor URL form on project detail page
- OpenAI call: compare your site vs competitor (content quality, keyword overlap, gaps)
- Side-by-side comparison display with actionable recommendations
- Save competitor analysis results to DB

### 8. Backlink Tracker
- DB: `backlinks` table (id, project_id, source_url, target_url, anchor_text, status, discovered_at)
- Manual backlink entry form (source URL, anchor text)
- Backlink table with status (active/broken), sortable
- Backlink summary stats on project detail page

### 9. Site Audit Tool
- Input: full site URL
- OpenAI call: comprehensive technical SEO audit (page speed suggestions, mobile-friendliness, meta tags, structured data, internal linking)
- Audit report page with categorized issues (critical/warning/info)
- DB: `audits` table (id, project_id, url, issues_count, report, created_at)
- Save audit history

### 10. Content Calendar
- DB: `content_items` table (id, project_id, title, topic, keywords, status, scheduled_date, content, created_at)
- Calendar view (month grid) showing planned content
- Content item CRUD (plan, draft, published statuses)
- Generate content directly from calendar item using the generator
- Drag to reschedule (or simple date picker)

### 11. Rank Tracking History
- DB: `rank_history` table (id, keyword_id, position, checked_at)
- Record keyword position over time (manual check-in button)
- Position history chart per keyword (line chart showing rank changes)
- Rank change indicators (up/down arrows with delta)
- Weekly summary view

### 12. Reports & Export
- Generate PDF/HTML SEO report for a project
- Include: keyword rankings, analysis scores, competitor comparison, audit results
- Export data as CSV (keywords, analyses, backlinks)
- Shareable report link (public read-only page)
- DB: `reports` table (id, project_id, type, data, created_at)

### 13. Meta Tag Generator
- Input: page title, description, keywords, page type
- OpenAI call: generate optimized meta tags (title, description, OG tags, Twitter cards, structured data JSON-LD)
- Live preview of how it looks in Google search results
- Copy all tags as HTML snippet

### 14. Internal Linking Suggestions
- Input: paste article content + list of existing site pages
- OpenAI call: suggest internal links (which phrases to link, which pages to link to)
- Display suggestions with highlighted anchor text
- Copy updated content with links inserted

### 15. Settings & Profile
- Profile page (email, name, avatar placeholder)
- API usage tracking (count OpenAI calls made)
- DB: add `api_calls_count` column to profiles
- Theme toggle (dark/light mode)
- Delete account functionality

## Database Schema (Supabase)

Core tables (created):
- `profiles`, `projects`, `keywords`, `analyses`

Phase 2 tables (build as needed):
- `competitors`, `backlinks`, `audits`, `content_items`, `rank_history`, `reports`

RLS: All tables filtered by `auth.uid() = user_id` (or via project ownership).

## Design Direction
- Dark theme by default
- Clean, minimal dashboard aesthetic
- Card-based layouts
- No flashy gradients — professional and focused
