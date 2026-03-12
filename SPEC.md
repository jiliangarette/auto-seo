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

## Modules — Phase 3 (Polish, UX & Advanced)

### 16. Dashboard Overhaul
- Real-time stats from DB (total keywords, avg score, total backlinks, active audits)
- Recent activity feed (last 10 actions across all modules)
- Quick-action cards linking to each tool
- Project health score (composite of SEO score, keyword count, backlink health)

### 17. Keyword Difficulty Estimator
- OpenAI call: estimate ranking difficulty for a keyword (competition, domain authority needed, content quality required)
- Difficulty badge (easy/medium/hard) per keyword in tracker
- Batch difficulty check for all project keywords
- Keyword opportunity score (volume vs difficulty ratio)

### 18. Content Optimizer
- Paste existing content + target keyword
- OpenAI call: suggest improvements (keyword density, readability, heading structure, word count)
- Before/after comparison view
- Optimization score with specific action items

### 19. SERP Preview Tool
- Input: URL + target keyword
- Generate realistic SERP preview (desktop + mobile)
- Show character count warnings for title/description
- Rich snippet preview (FAQ, How-to, Review stars)

### 20. Bulk Operations
- Bulk keyword import from CSV
- Bulk content item creation from CSV
- Bulk backlink import
- Export all project data as ZIP (CSV files for each entity)

### 21. Notification System
- Toast-based notification center (bell icon in navbar)
- Track completed analyses, audits, reports
- Notification badge count
- Mark as read / clear all

### 22. Search & Filter
- Global search bar in navbar (search across keywords, projects, content items)
- Advanced filters on keyword table (position range, volume range)
- Filter content calendar by status
- Search audit issues by category/severity

### 23. Onboarding Flow
- First-login welcome modal with setup wizard
- Create first project step
- Add first keyword step
- Run first analysis step
- Progress indicator (setup checklist on dashboard)

### 24. Performance & Code Quality
- Code-split routes with React.lazy + Suspense
- Loading skeletons for all data-fetching components
- Error boundaries with retry buttons
- Optimistic updates on mutations (instant UI feedback)

## Modules — Phase 4 (Growth & Scale)

### 25. AI Content Brief Generator
- Input: target keyword + audience
- OpenAI call: generate full content brief (outline, word count target, competitor angles, questions to answer)
- Save briefs to content calendar items
- Brief-to-draft workflow

### 26. Page Speed Insights Integration
- Input: URL to analyze
- OpenAI-simulated performance scoring (Core Web Vitals suggestions)
- Actionable performance recommendations
- Save speed audit history

### 27. Schema Markup Generator
- Select schema type (Article, Product, FAQ, HowTo, LocalBusiness, etc.)
- Form-based input for schema fields
- Generate JSON-LD output
- Validate and copy snippet

### 28. Readability Analyzer
- Paste content for analysis
- Calculate Flesch-Kincaid score, sentence length, paragraph length
- Highlight complex sentences
- Suggest simplifications via OpenAI

### 29. Social Media Preview
- Input: URL + title + description + image
- Preview cards for Facebook, Twitter/X, LinkedIn
- OG tag generator with live preview
- Copy all social meta tags

### 30. Multi-Project Dashboard
- Overview grid of all projects with health scores
- Compare projects side-by-side
- Aggregate stats across all projects
- Project archiving

## Design Direction
- Dark theme by default
- Clean, minimal dashboard aesthetic
- Card-based layouts
- No flashy gradients — professional and focused

## Autonomous Loop Rules
When all tasks in PROGRESS.md are complete:
1. Read SPEC.md for the next unchecked phase
2. Add new phase items to PROGRESS.md
3. Continue building
This ensures the loop never idles — there's always more to build.
