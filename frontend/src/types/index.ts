export type Role = "student" | "recruiter" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url?: string | null;
  status: string;
  email_verified: boolean;
  onboarding_completed: boolean;
  company_id?: string | null;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface Salary {
  min?: number;
  max?: number;
  currency?: string;
  period?: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  type: string;
  workplace: string;
  location?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  experience_level: string;
  salary: Salary;
  openings: number;
  deadline?: string | null;
  status: string;
  stats: { views: number; applicants: number };
  created_at: string;
  match_score?: number;
}

export interface Application {
  id: string;
  job_id: string;
  company_id: string;
  student_id: string;
  stage: string;
  status: string;
  match_score: number;
  ats_score: number;
  ranking?: number | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface StudentDashboard {
  profile_completion: number;
  placement_readiness: number;
  resume_score: number;
  applications_sent: number;
  interview_invites: number;
  stage_breakdown: Record<string, number>;
  skills: string[];
}

export interface RecruiterDashboard {
  active_jobs: number;
  applicants: number;
  funnel: Record<string, number>;
  interview_pipeline: number;
}

export interface AdminDashboard {
  total_users: number;
  active_users: number;
  students: number;
  recruiters: number;
  jobs_posted: number;
  published_jobs: number;
  applications_submitted: number;
  pending_company_approvals: number;
  mrr_estimate: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  skip: number;
  has_more: boolean;
}
