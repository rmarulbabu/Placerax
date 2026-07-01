import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCompany } from "@/api/hooks";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Company } from "@/types";

const SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

interface CompanyForm {
  name: string;
  logo_url: string;
  industry: string;
  size: string;
  website: string;
  location: string;
  about: string;
  linkedin_url: string;
  hr_email: string;
}

const EMPTY: CompanyForm = {
  name: "",
  logo_url: "",
  industry: "",
  size: "",
  website: "",
  location: "",
  about: "",
  linkedin_url: "",
  hr_email: "",
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CompanyWorkspacePage() {
  const { data: company, isLoading } = useMyCompany();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const bootstrap = useAuthStore((s) => s.bootstrap);

  const [form, setForm] = useState<CompanyForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(company);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? "",
        logo_url: company.logo_url ?? "",
        industry: company.industry ?? "",
        size: company.size ?? "",
        website: company.website ?? "",
        location: company.locations?.[0] ?? "",
        about: company.about ?? "",
        linkedin_url: company.linkedin_url ?? "",
        hr_email: company.hr_email ?? "",
      });
    }
  }, [company]);

  const set = (key: keyof CompanyForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (form.name.trim().length < 2) return toast.error("Company name is required.");
    if (form.hr_email && !emailRe.test(form.hr_email))
      return toast.error("Enter a valid HR contact email.");

    const payload = {
      name: form.name.trim(),
      logo_url: form.logo_url.trim() || null,
      industry: form.industry.trim() || null,
      size: form.size || null,
      website: form.website.trim() || null,
      location: form.location.trim() || null,
      about: form.about.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      hr_email: form.hr_email.trim() || null,
    };

    setSaving(true);
    try {
      if (isEditing && company) {
        await api.patch<Company>(`/companies/${company.id}`, payload);
        qc.invalidateQueries({ queryKey: ["company", "mine"] });
        toast.success("Company workspace updated.");
      } else {
        await api.post<Company>("/companies", payload);
        // Refresh identity (now has company_id) + related queries.
        await bootstrap();
        qc.invalidateQueries({ queryKey: ["company", "mine"] });
        qc.invalidateQueries({ queryKey: ["dashboard", "recruiter"] });
        toast.success("Company workspace created — you can now post jobs!");
        navigate("/recruiter/jobs");
      }
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Company Workspace" description="Set up your company profile." />
        <Skeleton className="h-96" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={isEditing ? "Company Workspace" : "Create Company Workspace"}
        description={
          isEditing
            ? "Manage your company profile and hiring brand."
            : "Set up your company profile to start posting jobs."
        }
        actions={
          isEditing && company?.website ? (
            <Button variant="secondary" asChild>
              <a href={company.website} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> View website
              </a>
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" /> Company details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Company Name *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Acme AI" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Company Logo URL</Label>
            <Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://…/logo.png" />
          </div>
          <div>
            <Label className="mb-1.5 block">Industry</Label>
            <Input value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Artificial Intelligence" />
          </div>
          <div>
            <Label className="mb-1.5 block">Company Size</Label>
            <select
              className="h-10 w-full rounded-lg border border-input bg-surface-2/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.size}
              onChange={(e) => set("size", e.target.value)}
            >
              <option value="">Select size…</option>
              {SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s} employees
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block">Website</Label>
            <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://company.com" />
          </div>
          <div>
            <Label className="mb-1.5 block">Location</Label>
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Bengaluru, IN" />
          </div>
          <div>
            <Label className="mb-1.5 block">LinkedIn URL</Label>
            <Input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/company/…" />
          </div>
          <div>
            <Label className="mb-1.5 block">HR Contact Email</Label>
            <Input type="email" value={form.hr_email} onChange={(e) => set("hr_email", e.target.value)} placeholder="hr@company.com" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Company Description</Label>
            <Textarea value={form.about} onChange={(e) => set("about", e.target.value)} placeholder="What does your company do?" />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isEditing ? "Save changes" : "Create Company Workspace"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
