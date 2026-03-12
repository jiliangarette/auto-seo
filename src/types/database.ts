export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  url: string | null;
  created_at: string;
}

export interface Keyword {
  id: string;
  project_id: string;
  keyword: string;
  position: number | null;
  search_volume: number | null;
  created_at: string;
}

export interface Analysis {
  id: string;
  project_id: string;
  url: string;
  score: number | null;
  suggestions: Record<string, unknown> | null;
  raw_response: Record<string, unknown> | null;
  created_at: string;
}

export interface Competitor {
  id: string;
  project_id: string;
  url: string;
  name: string;
  notes: string | null;
  created_at: string;
}

export interface Audit {
  id: string;
  project_id: string;
  url: string;
  issues_count: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  report: {
    issues: AuditIssue[];
  };
  created_at: string;
}

export interface AuditIssue {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
}

export interface Backlink {
  id: string;
  project_id: string;
  source_url: string;
  target_url: string;
  anchor_text: string | null;
  status: 'active' | 'broken' | 'pending';
  discovered_at: string;
}

export interface ContentItem {
  id: string;
  project_id: string;
  title: string;
  topic: string | null;
  keywords: string | null;
  status: 'plan' | 'draft' | 'published';
  scheduled_date: string | null;
  content: string | null;
  created_at: string;
}

export interface RankHistory {
  id: string;
  keyword_id: string;
  project_id: string;
  user_id: string;
  position: number;
  checked_at: string;
  created_at: string;
}

export interface CompetitorAnalysis {
  id: string;
  competitor_id: string;
  project_id: string;
  comparison: Record<string, unknown>;
  strengths: string[] | null;
  weaknesses: string[] | null;
  opportunities: string[] | null;
  score: number | null;
  created_at: string;
}
