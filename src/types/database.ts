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
