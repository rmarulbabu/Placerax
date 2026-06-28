import { ListChecks } from "lucide-react";
import { useMyApplications } from "@/api/hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"];

const stageVariant: Record<string, "muted" | "default" | "accent" | "success" | "danger"> = {
  applied: "muted",
  screening: "default",
  interview: "accent",
  offer: "success",
  hired: "success",
  rejected: "danger",
};

export default function ApplicationsPage() {
  const { data, isLoading } = useMyApplications();

  const counts = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = (data ?? []).filter((a) => a.stage === s).length;
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Application tracker" description="Track every application through the hiring funnel." />

      {/* funnel summary */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {STAGES.map((s) => (
          <Card key={s} className="p-4">
            <p className="font-display text-2xl font-bold tabular-nums">{counts[s] ?? 0}</p>
            <p className="text-xs capitalize text-muted-foreground">{s}</p>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : data?.length ? (
        <Card className="divide-y divide-white/[0.05]">
          {data.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Application · {a.job_id.slice(-6)}</p>
                <p className="text-xs text-muted-foreground">Applied {timeAgo(a.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="font-mono text-sm font-semibold">{a.match_score}%</p>
                  <p className="text-[11px] text-muted-foreground">match</p>
                </div>
                <Badge variant={stageVariant[a.stage] ?? "muted"} className="capitalize">
                  {a.stage}
                </Badge>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState icon={ListChecks} title="No applications yet" description="Apply to jobs and they'll show up here." />
      )}
    </>
  );
}
