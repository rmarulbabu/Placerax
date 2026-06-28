import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdminDashboard,
  Application,
  Job,
  NotificationItem,
  Paginated,
  RecruiterDashboard,
  StudentDashboard,
} from "@/types";

/* ------------------------------ Jobs ------------------------------ */
export interface JobFilters {
  q?: string;
  type?: string;
  workplace?: string;
  location?: string;
  skills?: string;
}

export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Job>>("/jobs", { params: filters });
      return data;
    },
  });
}

export function useJob(slug: string) {
  return useQuery({
    queryKey: ["job", slug],
    queryFn: async () => (await api.get<Job>(`/jobs/${slug}`)).data,
    enabled: !!slug,
  });
}

export function useJobRecommendations() {
  return useQuery({
    queryKey: ["recommendations", "jobs"],
    queryFn: async () => (await api.get<Job[]>("/ai/recommendations/jobs")).data,
  });
}

/* -------------------------- Applications -------------------------- */
export function useMyApplications() {
  return useQuery({
    queryKey: ["applications", "me"],
    queryFn: async () => (await api.get<Application[]>("/applications/me")).data,
  });
}

export function useApply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { job_id: string; resume_id?: string; cover_letter?: string }) =>
      (await api.post<Application>("/applications", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications", "me"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "student"] });
    },
  });
}

export function usePipeline(jobId: string) {
  return useQuery({
    queryKey: ["pipeline", jobId],
    queryFn: async () =>
      (
        await api.get<{
          job_id: string;
          stages: string[];
          board: Record<string, Application[]>;
        }>(`/pipeline/${jobId}`)
      ).data,
    enabled: !!jobId,
  });
}

export function useMoveStage(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) =>
      (await api.patch(`/applications/${id}/stage`, { stage })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline", jobId] }),
  });
}

/* ---------------------------- Saved jobs --------------------------- */
export function useSavedJobs() {
  return useQuery({
    queryKey: ["saved-jobs"],
    queryFn: async () => (await api.get<Job[]>("/saved-jobs")).data,
  });
}

export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, saved }: { jobId: string; saved: boolean }) =>
      saved
        ? api.delete(`/saved-jobs/${jobId}`)
        : api.post(`/saved-jobs/${jobId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-jobs"] }),
  });
}

/* ---------------------------- Dashboards --------------------------- */
export function useStudentDashboard() {
  return useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: async () => (await api.get<StudentDashboard>("/dashboard/student")).data,
  });
}

export function useRecruiterDashboard() {
  return useQuery({
    queryKey: ["dashboard", "recruiter"],
    queryFn: async () => (await api.get<RecruiterDashboard>("/dashboard/recruiter")).data,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: async () => (await api.get<AdminDashboard>("/dashboard/admin")).data,
  });
}

/* -------------------------- Notifications -------------------------- */
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () =>
      (await api.get<{ items: NotificationItem[]; unread: number }>("/notifications")).data,
    refetchInterval: 60_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: string[]) => api.post("/notifications/read", { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

/* ----------------------------- Profile ----------------------------- */
export function useStudentProfile() {
  return useQuery({
    queryKey: ["profile", "student"],
    queryFn: async () => (await api.get("/profiles/student/me")).data,
  });
}

export function useRecommendedSkillGap() {
  return useMutation({
    mutationFn: async (target_skills: string[]) =>
      (await api.post("/ai/skill-gap", { target_skills })).data,
  });
}
