import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useApply, useMyApplications, useSavedJobs, useToggleSave } from "@/api/hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { JobCard } from "@/components/common/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import type { Job } from "@/types";

export default function SavedJobs() {
  const { data, isLoading } = useSavedJobs();
  const { data: applications } = useMyApplications();
  const toggleSave = useToggleSave();
  const apply = useApply();
  const appliedIds = new Set((applications ?? []).map((a) => a.job_id));

  const onApply = async (job: Job) => {
    try {
      await apply.mutateAsync({ job_id: job.id });
      toast.success(`Applied to ${job.title}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="Saved jobs" description="Opportunities you've bookmarked for later." />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((job, i) => (
            <JobCard
              key={job.id}
              job={job}
              index={i}
              saved
              onSave={() => toggleSave.mutate({ jobId: job.id, saved: true })}
              onApply={onApply}
              applied={appliedIds.has(job.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={Bookmark} title="Nothing saved yet" description="Tap the bookmark on any job to save it here." />
      )}
    </>
  );
}
