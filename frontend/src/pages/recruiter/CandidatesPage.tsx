import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Users } from "lucide-react";
import { toast } from "sonner";
import { usePipeline, useMoveStage } from "@/api/hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiErrorMessage } from "@/lib/api";
import type { Application, Job } from "@/types";

const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};
const NEXT_STAGE: Record<string, string> = {
  applied: "screening",
  screening: "interview",
  interview: "offer",
  offer: "hired",
};

export default function CandidatesPage() {
  const [params, setParams] = useSearchParams();
  const jobId = params.get("job") ?? "";

  const { data: jobs } = useQuery({
    queryKey: ["jobs", "mine"],
    queryFn: async () => (await api.get<Job[]>("/jobs/manage/mine")).data,
  });

  const selectedJob = jobs?.find((j) => j.id === jobId) ?? jobs?.[0];
  const activeId = selectedJob?.id ?? "";

  const { data: pipeline, isLoading } = usePipeline(activeId);
  const move = useMoveStage(activeId);

  const advance = async (app: Application) => {
    const next = NEXT_STAGE[app.stage];
    if (!next) return;
    try {
      await move.mutateAsync({ id: app.id, stage: next });
      toast.success(`Moved to ${STAGE_LABELS[next]}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (!jobs?.length) {
    return (
      <>
        <PageHeader title="Candidates" description="ATS pipeline for your jobs." />
        <EmptyState icon={Users} title="No jobs to manage" description="Post a job to start receiving candidates." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Candidate pipeline"
        description="Drag-free Kanban — advance candidates through your hiring stages."
        actions={
          <select
            value={activeId}
            onChange={(e) => setParams({ job: e.target.value })}
            className="h-10 rounded-lg border border-input bg-surface-2/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id} className="bg-surface">
                {j.title}
              </option>
            ))}
          </select>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {(pipeline?.stages ?? []).map((stage) => {
            const items = pipeline?.board?.[stage] ?? [];
            return (
              <div key={stage} className="w-72 shrink-0">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-sm font-medium capitalize">{STAGE_LABELS[stage] ?? stage}</span>
                  <Badge variant="muted">{items.length}</Badge>
                </div>
                <div className="space-y-3">
                  {items.map((app) => (
                    <Card key={app.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{app.student_id.slice(-6)}
                        </span>
                        <Badge variant="accent">{app.match_score}%</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>ATS {app.ats_score}</span>
                        {NEXT_STAGE[stage] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => advance(app)}
                          >
                            Advance <ChevronRight className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                  {!items.length && (
                    <div className="rounded-lg border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
