import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { useAuthStore } from "@/store/authStore";

import LandingPage from "@/pages/public/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import OnboardingPage from "@/pages/auth/OnboardingPage";

import StudentDashboard from "@/pages/student/StudentDashboard";
import FindJobs from "@/pages/student/FindJobs";
import ApplicationsPage from "@/pages/student/ApplicationsPage";
import SavedJobs from "@/pages/student/SavedJobs";
import ResumeHub from "@/pages/student/ResumeHub";
import CareerToolsPage from "@/pages/student/CareerToolsPage";

import RecruiterDashboard from "@/pages/recruiter/RecruiterDashboard";
import RecruiterJobs from "@/pages/recruiter/RecruiterJobs";
import CandidatesPage from "@/pages/recruiter/CandidatesPage";
import RecruiterGeneric from "@/pages/recruiter/RecruiterGeneric";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminQueues from "@/pages/admin/AdminQueues";

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Onboarding (auth required) */}
      <Route element={<RequireAuth roles={["student"]} />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Student workspace */}
      <Route element={<RequireAuth roles={["student"]} />}>
        <Route element={<WorkspaceLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/jobs" element={<FindJobs />} />
          <Route path="/student/applications" element={<ApplicationsPage />} />
          <Route path="/student/saved" element={<SavedJobs />} />
          <Route path="/student/resume" element={<ResumeHub />} />
          <Route path="/student/skill-gap" element={<CareerToolsPage mode="skill-gap" />} />
          <Route path="/student/roadmap" element={<CareerToolsPage mode="roadmap" />} />
          <Route path="/student/assistant" element={<CareerToolsPage mode="assistant" />} />
        </Route>
      </Route>

      {/* Recruiter workspace */}
      <Route element={<RequireAuth roles={["recruiter"]} />}>
        <Route element={<WorkspaceLayout />}>
          <Route path="/recruiter" element={<RecruiterDashboard />} />
          <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
          <Route path="/recruiter/candidates" element={<CandidatesPage />} />
          <Route path="/recruiter/interviews" element={<RecruiterGeneric title="Interviews" />} />
          <Route path="/recruiter/analytics" element={<RecruiterGeneric title="Hiring Analytics" />} />
          <Route path="/recruiter/company" element={<RecruiterGeneric title="Company Workspace" />} />
        </Route>
      </Route>

      {/* Admin workspace */}
      <Route element={<RequireAuth roles={["admin"]} />}>
        <Route element={<WorkspaceLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminQueues view="users" />} />
          <Route path="/admin/recruiters" element={<AdminQueues view="recruiters" />} />
          <Route path="/admin/companies" element={<AdminQueues view="companies" />} />
          <Route path="/admin/jobs" element={<AdminQueues view="jobs" />} />
          <Route path="/admin/settings" element={<AdminQueues view="settings" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
