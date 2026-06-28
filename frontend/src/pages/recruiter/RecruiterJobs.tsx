import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Loader2, Plus, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, apiErrorMessage } from "@/lib/api";
import type { Job } from "@/types";

const statusVariant: Record<string, "muted" | "warning" | "success" | "danger"> = {
  draft: "muted",
  pending_moderation: "warning",
  published: "success",
  closed: "muted",
  rejected: "danger",
};

export default function RecruiterJobs() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", "mine"],
    queryFn: async () => (await api.get<Job[]>("/jobs/manage/mine")).data,
  });

  const publish = useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs", "mine"] });
      toast.success("Submitted for moderation.");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Post and manage your openings."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Post a job
              </Button>
            </DialogTrigger>
            <JobWizard onDone={() => setOpen(false)} />
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="space-y-3">
          {data.map((job) => (
            <Card key={job.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold">{job.title}</h3>
                  <Badge variant={statusVariant[job.status] ?? "muted"} className="capitalize">
                    {job.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                  {job.type.replace("_", " ")} · {job.workplace} · {job.stats?.applicants ?? 0} applicants
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" asChild>
                  <Link to={`/recruiter/candidates?job=${job.id}`}>
                    <Users className="size-4" /> Pipeline
                  </Link>
                </Button>
                {job.status === "draft" && (
                  <Button size="sm" onClick={() => publish.mutate(job.id)} disabled={publish.isPending}>
                    <Send className="size-4" /> Publish
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Create your first opening with the posting wizard."
        />
      )}
    </>
  );
}

function JobWizard({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("internship");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post("/jobs", {
        title,
        type,
        workplace: "remote",
        description,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        requirements: [],
        responsibilities: [],
      });
      qc.invalidateQueries({ queryKey: ["jobs", "mine"] });
      toast.success("Job created as draft. Publish when ready.");
      onDone();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Post a new job</DialogTitle>
        <DialogDescription>Create a draft — it goes to moderation when you publish.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input placeholder="Software Engineer Intern" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <div className="flex flex-wrap gap-2">
            {["internship", "full_time", "part_time", "contract"].map((t) => (
              <button key={t} onClick={() => setType(t)}>
                <Badge variant={type === t ? "default" : "outline"} className="cursor-pointer capitalize">
                  {t.replace("_", " ")}
                </Badge>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            placeholder="Describe the role, responsibilities, and what makes it exciting…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Skills (comma-separated)</Label>
          <Input placeholder="python, react, sql" value={skills} onChange={(e) => setSkills(e.target.value)} />
        </div>
        <Button onClick={submit} disabled={loading || title.length < 3 || description.length < 20} className="w-full">
          {loading && <Loader2 className="size-4 animate-spin" />} Create draft
        </Button>
      </div>
    </DialogContent>
  );
}
