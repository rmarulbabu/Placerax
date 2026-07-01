import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Github,
  GraduationCap,
  Link2,
  Linkedin,
  Loader2,
  Pencil,
  Plus,
  Save,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { ScoreRing } from "@/components/common/ScoreRing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Education, Resume, StudentProfile, User } from "@/types";

interface ProfileForm {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  about: string;
  college: string;
  degree: string;
  department: string;
  graduation_year: string;
  cgpa: string;
  portfolio: string;
  github: string;
  linkedin: string;
}

const EMPTY_FORM: ProfileForm = {
  full_name: "",
  email: "",
  phone: "",
  location: "",
  about: "",
  college: "",
  degree: "",
  department: "",
  graduation_year: "",
  cgpa: "",
  portfolio: "",
  github: "",
  linkedin: "",
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  const isStudent = user?.role === "student";

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const profileQuery = useQuery({
    queryKey: ["profile", "student"],
    queryFn: async () => (await api.get<StudentProfile>("/profiles/student/me")).data,
    enabled: isStudent,
  });

  const resumesQuery = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await api.get<Resume[]>("/resumes")).data,
    enabled: isStudent,
  });

  const profile = profileQuery.data;
  const activeResume = useMemo(
    () => resumesQuery.data?.find((r) => r.is_active) ?? resumesQuery.data?.[0],
    [resumesQuery.data],
  );

  // Hydrate the form whenever the source data changes (and we're not editing).
  useEffect(() => {
    if (!user) return;
    const edu = profile?.education?.[0];
    const links = profile?.links ?? {};
    setForm({
      full_name: user.full_name ?? "",
      email: user.email ?? "",
      phone: profile?.phone ?? "",
      location: profile?.location ?? "",
      about: profile?.about ?? "",
      college: edu?.institution ?? "",
      degree: edu?.degree ?? "",
      department: edu?.field ?? "",
      graduation_year: edu?.end != null ? String(edu.end) : "",
      cgpa: edu?.cgpa != null ? String(edu.cgpa) : "",
      portfolio: links.portfolio ?? "",
      github: links.github ?? "",
      linkedin: links.linkedin ?? "",
    });
    setSkills(profile?.skills ?? []);
  }, [user, profile]);

  const set = (key: keyof ProfileForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addSkill = () => {
    const value = skillInput.trim().toLowerCase();
    if (!value) return;
    if (!skills.includes(value)) setSkills((s) => [...s, value]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) => setSkills((s) => s.filter((x) => x !== skill));

  const cancel = () => {
    setEditing(false);
    // re-hydrate from source
    qc.invalidateQueries({ queryKey: ["profile", "student"] });
  };

  const save = async () => {
    if (!form.full_name.trim()) return toast.error("Full name is required.");
    if (!emailRe.test(form.email)) return toast.error("Enter a valid email address.");
    if (form.cgpa && (Number.isNaN(Number(form.cgpa)) || Number(form.cgpa) < 0 || Number(form.cgpa) > 10))
      return toast.error("CGPA must be a number between 0 and 10.");

    setSaving(true);
    try {
      // 1) Account fields on the user record
      if (form.full_name !== user?.full_name || form.email !== user?.email) {
        const { data } = await api.patch<User>("/auth/me", {
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
        });
        setUser(data);
      }

      // 2) Student profile fields
      if (isStudent) {
        const education: Education[] = [];
        if (form.college || form.degree || form.department || form.graduation_year || form.cgpa) {
          education.push({
            institution: form.college || "N/A",
            degree: form.degree || "N/A",
            field: form.department || null,
            end: form.graduation_year ? Number(form.graduation_year) : null,
            cgpa: form.cgpa ? Number(form.cgpa) : null,
          });
        }
        const links: Record<string, string> = { ...(profile?.links ?? {}) };
        for (const [k, v] of Object.entries({
          portfolio: form.portfolio,
          github: form.github,
          linkedin: form.linkedin,
        })) {
          if (v.trim()) links[k] = v.trim();
          else delete links[k];
        }
        await api.patch("/profiles/student/me", {
          phone: form.phone,
          location: form.location,
          about: form.about,
          skills,
          education,
          links,
        });
        qc.invalidateQueries({ queryKey: ["profile", "student"] });
        qc.invalidateQueries({ queryKey: ["dashboard", "student"] });
      }

      toast.success("Profile updated.");
      setEditing(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onResumeSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<Resume>("/resumes", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await api.post(`/resumes/${data.id}/activate`);
      qc.invalidateQueries({ queryKey: ["resumes"] });
      qc.invalidateQueries({ queryKey: ["profile", "student"] });
      toast.success("Resume uploaded and set as active.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!user) return null;

  const disabled = !editing || saving;
  const completion = profile?.profile_strength ?? 0;
  const readiness = profile?.placement_readiness ?? 0;
  const atsScore = activeResume?.analysis?.ats_score ?? 0;
  const improvements = activeResume?.analysis?.improvements ?? [];

  return (
    <>
      <PageHeader
        title="My Profile"
        description="Manage your personal details, academics, skills, and portfolio."
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={cancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save changes
              </Button>
            </div>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Edit profile
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Personal information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-4 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name">
                <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} disabled={disabled} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={disabled} />
              </Field>
              <Field label="Phone Number">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} disabled={disabled} placeholder="+91 …" />
              </Field>
              <Field label="Location">
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} disabled={disabled} placeholder="City, Country" />
              </Field>
              <Field label="About Me" className="sm:col-span-2">
                <Textarea value={form.about} onChange={(e) => set("about", e.target.value)} disabled={disabled} placeholder="A short introduction…" />
              </Field>
            </CardContent>
          </Card>

          {isStudent && (
            <>
              {/* Academic information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-primary" /> Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Field label="College Name">
                    <Input value={form.college} onChange={(e) => set("college", e.target.value)} disabled={disabled} />
                  </Field>
                  <Field label="Degree">
                    <Input value={form.degree} onChange={(e) => set("degree", e.target.value)} disabled={disabled} placeholder="B.Tech" />
                  </Field>
                  <Field label="Department">
                    <Input value={form.department} onChange={(e) => set("department", e.target.value)} disabled={disabled} placeholder="Computer Science" />
                  </Field>
                  <Field label="Graduation Year">
                    <Input value={form.graduation_year} onChange={(e) => set("graduation_year", e.target.value)} disabled={disabled} placeholder="2026" inputMode="numeric" />
                  </Field>
                  <Field label="CGPA">
                    <Input value={form.cgpa} onChange={(e) => set("cgpa", e.target.value)} disabled={disabled} placeholder="8.5" inputMode="decimal" />
                  </Field>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editing && (
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        placeholder="Add a skill and press Enter"
                      />
                      <Button type="button" variant="secondary" size="icon" onClick={addSkill}>
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {skills.length ? (
                      skills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium capitalize text-primary"
                        >
                          {s}
                          {editing && (
                            <button
                              type="button"
                              onClick={() => removeSkill(s)}
                              className="rounded-full p-0.5 hover:bg-primary/20"
                              aria-label={`Remove ${s}`}
                            >
                              <X className="size-3" />
                            </button>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No skills added yet.</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="size-4 text-primary" /> Portfolio & Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Field label="Portfolio Website" className="sm:col-span-2">
                    <Input value={form.portfolio} onChange={(e) => set("portfolio", e.target.value)} disabled={disabled} placeholder="https://your-portfolio.com" />
                  </Field>
                  <Field label="GitHub">
                    <div className="relative">
                      <Github className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-9" value={form.github} onChange={(e) => set("github", e.target.value)} disabled={disabled} placeholder="https://github.com/you" />
                    </div>
                  </Field>
                  <Field label="LinkedIn">
                    <div className="relative">
                      <Linkedin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-9" value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} disabled={disabled} placeholder="https://linkedin.com/in/you" />
                    </div>
                  </Field>
                  <div className="sm:col-span-2">
                    <Label className="mb-1.5 block">Resume</Label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onResumeSelected} />
                      <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                        {activeResume ? "Replace resume" : "Upload resume"}
                      </Button>
                      {activeResume && (
                        <span className="text-sm text-muted-foreground">
                          {activeResume.file_name} · ATS {atsScore}/100
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Placement readiness sidebar */}
        {isStudent && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Placement Readiness</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <ScoreRing value={readiness} label="Ready" />
                <div className="grid w-full grid-cols-2 gap-3">
                  <MiniStat label="ATS Score" value={atsScore} />
                  <MiniStat label="Completion" value={completion} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                {improvements.length ? (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {improvements.map((tip, i) => (
                      <li key={i} className="flex gap-2">
                        <Badge variant="warning" className="mt-0.5 h-5 shrink-0 px-1.5">
                          {i + 1}
                        </Badge>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Upload a resume to get personalized improvement tips.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-surface-2/60 p-3 text-center">
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
