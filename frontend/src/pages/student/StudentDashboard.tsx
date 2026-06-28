import { Link } from "react-router-dom";
import { Activity, FileText, Send, Sparkles, TrendingUp } from "lucide-react";
import { useJobRecommendations, useStudentDashboard } from "@/api/hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { ScoreRing } from "@/components/common/ScoreRing";
import { StatWidget } from "@/components/common/StatWidget";
import { JobCard } from "@/components/common/JobCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useStudentDashboard();
  const { data: recos } = useJobRecommendations();

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.full_name.split(" ")[0] ?? "there"}`}
        description="Here's your placement readiness at a glance."
        actions={
          <Button asChild>
            <Link to="/student/jobs">
              <Sparkles className="size-4" /> Find opportunities
            </Link>
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatWidget label="Applications sent" value={data?.applications_sent ?? 0} icon={Send} index={0} />
            <StatWidget label="Interview invites" value={data?.interview_invites ?? 0} icon={Activity} index={1} />
            <StatWidget label="Resume score" value={data?.resume_score ?? 0} icon={FileText} index={2} />
            <StatWidget label="Profile strength" value={`${data?.profile_completion ?? 0}%`} icon={TrendingUp} index={3} />
          </>
        )}
      </div>

      {/* score rings + skills */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Placement readiness</CardTitle>
          </CardHeader>
          <CardContent className="grid place-items-center">
            <ScoreRing value={data?.placement_readiness ?? 0} label="Ready" size={150} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resume / ATS score</CardTitle>
          </CardHeader>
          <CardContent className="grid place-items-center">
            <ScoreRing value={data?.resume_score ?? 0} label="ATS" size={150} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Strength</span>
                <span className="font-medium">{data?.profile_completion ?? 0}%</span>
              </div>
              <Progress value={data?.profile_completion ?? 0} />
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Your skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(data?.skills ?? []).map((s) => (
                  <Badge key={s} variant="muted" className="capitalize">
                    {s}
                  </Badge>
                ))}
                {!data?.skills?.length && (
                  <span className="text-sm text-muted-foreground">Add skills in your profile.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* recommended jobs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recommended for you</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/student/jobs">View all</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(recos ?? []).slice(0, 4).map((job, i) => (
            <JobCard key={job.id} job={job} index={i} />
          ))}
          {!recos?.length && (
            <Card className="md:col-span-2">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Recommendations appear once you add skills and jobs are published.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
