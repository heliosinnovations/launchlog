export type ProjectStatus = 'shipped' | 'beta' | 'sunset' | 'in_progress' | 'analyzing' | 'ready' | 'error';

export interface ProjectMetrics {
  usersCount?: number;
  revenue?: number;
  revenuePublic?: boolean;
  launchDate?: string;
  customKpis?: Array<{ label: string; value: string; isPublic: boolean }>;
}

export interface Project {
  id: string;
  user_id: string;
  github_repo_url: string;
  repo_name: string;
  repo_owner: string;
  tech_stack: string[] | null;
  description: string | null;
  readme_content: string | null;
  deployment_url: string | null;
  screenshot_url: string | null;
  screenshots: string[];
  primary_screenshot_index: number;
  github_stars: number;
  github_forks: number;
  last_commit_date: string | null;
  created_date: string | null;
  primary_language: string | null;
  custom_name: string | null;
  custom_description: string | null;
  launch_date: string | null;
  launch_story: string | null;
  revenue: number | null;
  users_count: number | null;
  is_public: boolean;
  display_order: number;
  status: 'analyzing' | 'ready' | 'error';
  project_status: ProjectStatus;
  metrics: ProjectMetrics;
  metrics_public: boolean;
  analysis_completed_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdatePayload {
  custom_name?: string | null;
  custom_description?: string | null;
  description?: string | null;
  tech_stack?: string[];
  deployment_url?: string | null;
  github_repo_url?: string;
  project_status?: ProjectStatus;
  metrics?: ProjectMetrics;
  metrics_public?: boolean;
  screenshots?: string[];
  primary_screenshot_index?: number;
  is_public?: boolean;
  deleted_at?: string | null;
}
