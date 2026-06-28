import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useApply, useJobs, useMyApplications, useToggleSave, useSavedJobs } from "@/api/hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { JobCard } from "@/components/common/JobCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Job } from "@/types";

const TYPES = ["internship", "full_time", "part_time", "contract"];
const WORKPLACES = ["remote", "onsite", "hybrid"];

export default function FindJobs() {
  const [params] = useSearchParams();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string | undefined>(params.get("type") ?? undefined);
  const [workplace, setWorkplace] = useState<string | undefined>(undefined);

  const filters = useMemo(() => ({ q: q || undefined, type, workplace }), [q, type, workplace]);
  const { data, isLoading } = useJobs(filters);
  const { data: applications } = useMyApplications();
  const { data: saved } = useSavedJobs();
  const apply = useApply();
  const toggleSave = useToggleSave();

  const appliedIds = new Set((applications ?? []).map((a) => a.job_id));
  const savedIds = new Set((saved ?? []).map((j) => j.id));

  const onApply = async (job: Job) => {
    try {
      await apply.mutateAsync({ job_id: job.id });
      toast.success(`Applied to ${job.title}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const onSave = (job: Job) =>
    toggleSave.mutate({ jobId: job.id, saved: savedIds.has(job.id) });

  return (
    <>
      <PageHeader title="Find jobs & internships" description="Browse curated openings matched to your profile." />

      {/* search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, skill, or keyword…"
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-3.5" /> Filters
          </span>
          {TYPES.map((t) => (
            <FilterChip key={t} active={type === t} onClick={() => setType(type === t ? undefined : t)}>
              {t.replace("_", " ")}
            </FilterChip>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          {WORKPLACES.map((w) => (
            <FilterChip key={w} active={workplace === w} onClick={() => setWorkplace(workplace === w ? undefined : w)}>
              {w}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : data?.items.length ? (
        <>
          <p className="text-sm text-muted-foreground">{data.total} opportunities</p>
          <div className="grid gap-4 md:grid-cols-2">
            {data.items.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                saved={savedIds.has(job.id)}
                onSave={onSave}
                onApply={onApply}
                applied={appliedIds.has(job.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState icon={Briefcase} title="No jobs found" description="Try adjusting your filters or search terms." />
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: import("react").ReactNode;
}) {
  return (
    <button onClick={onClick}>
      <Badge
        variant={active ? "default" : "outline"}
        className={cn("cursor-pointer capitalize", !active && "hover:border-primary/40")}
      >
        {children}
      </Badge>
    </button>
  );
}
