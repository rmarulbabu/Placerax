export type Role = "student" | "recruiter" | "admin";

export interface NotificationSettings {
  email: boolean;
  application_updates: boolean;
  interview_alerts: boolean;
}

export interface PrivacySettings {
  profile_visibility: "public" | "recruiters" | "private";
  portfolio_visibility: "public" | "private";
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

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
  settings?: UserSettings;
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

export interface Education {
  institution: string;
  degree: string;
  field?: string | null;
  start?: number | null;
  end?: number | null;
  cgpa?: number | null;
}

export interface StudentPreferences {
  roles: string[];
  locations: string[];
  job_types: string[];
}

export interface StudentProfile {
  id: string;
  user_id: string;
  headline?: string | null;
  location?: string | null;
  phone?: string | null;
  about?: string | null;
  education: Education[];
  experience: unknown[];
  skills: string[];
  projects: unknown[];
  links: Record<string, string>;
  preferences: StudentPreferences;
  profile_strength: number;
  placement_readiness: number;
  active_resume_id?: string | null;
}

export interface ResumeAnalysis {
  score: number;
  ats_score: number;
  strengths: string[];
  improvements: string[];
  missing_keywords: string[];
}

export interface Resume {
  id: string;
  student_id: string;
  file_url: string;
  file_name: string;
  analysis: ResumeAnalysis;
  is_active: boolean;
  created_at: string;
}

export interface PortfolioCategoryScores {
  performance: number;
  seo: number;
  accessibility: number;
  mobile: number;
  ux: number;
  project_quality: number;
}

export interface PortfolioAnalysis {
  portfolio_url: string;
  github_url?: string | null;
  fetched: boolean;
  overall_score: number;
  categories: PortfolioCategoryScores;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  priority_fixes: string[];
}

export interface SessionInfo {
  id: string;
  user_agent?: string | null;
  ip?: string | null;
  created_at: string;
  expires_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
  about?: string | null;
  locations: string[];
  linkedin_url?: string | null;
  hr_email?: string | null;
  approval_status: string;
  owner_id: string;
  team: string[];
  created_at?: string;
}
