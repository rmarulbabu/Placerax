import { Bookmark, BookmarkCheck, MapPin, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatSalary } from "@/lib/utils";
import type { Job } from "@/types";

interface JobCardProps {
  job: Job;
  index?: number;
  saved?: boolean;
  onSave?: (job: Job) => void;
  onApply?: (job: Job) => void;
  applied?: boolean;
}

export function JobCard({ job, index = 0, saved, onSave, onApply, applied }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Card className="group p-5 transition-all hover:border-primary/30 hover:bg-surface-2/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold">{job.title}</h3>
              {typeof job.match_score === "number" && (
                <Badge variant="accent" className="gap-1">
                  <Sparkles className="size-3" /> {job.match_score}% match
                </Badge>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="capitalize">{job.type.replace("_", " ")}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {job.location ?? job.workplace}
              </span>
              <span>{formatSalary(job.salary)}</span>
            </p>
          </div>
          {onSave && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSave(job)}
              className={cn(saved && "text-primary")}
            >
              {saved ? <BookmarkCheck className="size-[18px]" /> : <Bookmark className="size-[18px]" />}
            </Button>
          )}
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 5).map((s) => (
            <Badge key={s} variant="muted" className="capitalize">
              {s}
            </Badge>
          ))}
        </div>

        {onApply && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{job.stats?.applicants ?? 0} applicants</span>
            <Button size="sm" onClick={() => onApply(job)} disabled={applied} variant={applied ? "secondary" : "default"}>
              {applied ? "Applied" : "One-click apply"}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
