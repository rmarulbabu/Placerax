import {
  Bot,
  Brain,
  Briefcase,
  Building2,
  CalendarClock,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  Map,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  group?: string;
}

const studentNav: NavItem[] = [
  { label: "Dashboard", to: "/student", icon: LayoutDashboard, group: "Workspace" },
  { label: "Find Jobs", to: "/student/jobs", icon: Search, group: "Workspace" },
  { label: "Internships", to: "/student/jobs?type=internship", icon: GraduationCap, group: "Workspace" },
  { label: "Applications", to: "/student/applications", icon: ListChecks, group: "Workspace" },
  { label: "Saved", to: "/student/saved", icon: Briefcase, group: "Workspace" },
  { label: "Resume & ATS", to: "/student/resume", icon: FileText, group: "Career" },
  { label: "Skill Gap", to: "/student/skill-gap", icon: Brain, group: "Career" },
  { label: "Career Roadmap", to: "/student/roadmap", icon: Map, group: "Career" },
  { label: "AI Assistant", to: "/student/assistant", icon: Bot, group: "Career" },
  { label: "AI Portfolio Analyzer", to: "/ai/portfolio-analyzer", icon: Gauge, group: "Career" },
];

const recruiterNav: NavItem[] = [
  { label: "Dashboard", to: "/recruiter", icon: LayoutDashboard, group: "Workspace" },
  { label: "Jobs", to: "/recruiter/jobs", icon: Briefcase, group: "Workspace" },
  { label: "Candidates", to: "/recruiter/candidates", icon: Users, group: "Workspace" },
  { label: "Interviews", to: "/recruiter/interviews", icon: CalendarClock, group: "Workspace" },
  { label: "Analytics", to: "/recruiter/analytics", icon: Sparkles, group: "Insights" },
  { label: "Company", to: "/recruiter/company", icon: Building2, group: "Insights" },
];

const adminNav: NavItem[] = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard, group: "Platform" },
  { label: "Users", to: "/admin/users", icon: Users, group: "Platform" },
  { label: "Recruiters", to: "/admin/recruiters", icon: ShieldCheck, group: "Moderation" },
  { label: "Companies", to: "/admin/companies", icon: Building2, group: "Moderation" },
  { label: "Job Moderation", to: "/admin/jobs", icon: ListChecks, group: "Moderation" },
  { label: "Settings", to: "/admin/settings", icon: Settings2, group: "Platform" },
];

export function navForRole(role: Role): NavItem[] {
  if (role === "recruiter") return recruiterNav;
  if (role === "admin") return adminNav;
  return studentNav;
}

export function homeForRole(role: Role): string {
  if (role === "recruiter") return "/recruiter";
  if (role === "admin") return "/admin";
  return "/student";
}
