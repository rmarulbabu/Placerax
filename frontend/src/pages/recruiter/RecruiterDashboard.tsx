import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Briefcase, Building2, CalendarClock, ExternalLink, Pencil, Users } from "lucide-react";
import { useMyCompany, useRecruiterDashboard } from "@/api/hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { StatWidget } from "@/components/common/StatWidget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STAGE_ORDER = ["applied", "screening", "interview", "offer", "hired"];
const COLORS = ["#7c5cff", "#8a6bff", "#5ec8f0", "#34d399", "#22c55e"];

export default function RecruiterDashboard() {
  const { data, isLoading } = useRecruiterDashboard();
  const { data: company, isLoading: companyLoading } = useMyCompany();
  const navigate = useNavigate();

  const funnelData = STAGE_ORDER.map((stage) => ({
    stage: stage[0].toUpperCase() + stage.slice(1),
    count: data?.funnel?.[stage] ?? 0,
  }));

  return (
    <>
      <PageHeader title="Recruiter workspace" description="Your hiring pipeline at a glance." />

      {/* Company profile */}
      {companyLoading ? (
        <Skeleton className="h-24" />
      ) : company ? (
        <Card>
          <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="size-14 rounded-xl object-cover"
                />
              ) : (
                <div className="grid size-14 place-items-center rounded-xl bg-surface-2 text-primary">
                  <Building2 className="size-6" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{company.name}</h3>
                  <Badge variant={company.approval_status === "approved" ? "success" : "warning"} className="capitalize">
                    {company.approval_status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {[company.industry, company.locations?.[0]].filter(Boolean).join(" · ") ||
                    "Add your company details"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {company.website && (
                <Button variant="secondary" size="sm" asChild>
                  <a href={company.website} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> View
                  </a>
                </Button>
              )}
              <Button size="sm" onClick={() => navigate("/recruiter/company")}>
                <Pencil className="size-4" /> Edit Company
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-xl bg-surface-2 text-primary">
                <Building2 className="size-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">No company profile yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create a company workspace to start posting jobs.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/recruiter/company")}>
              <Building2 className="size-4" /> Create Company Workspace
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatWidget label="Active jobs" value={data?.active_jobs ?? 0} icon={Briefcase} index={0} />
            <StatWidget label="Total applicants" value={data?.applicants ?? 0} icon={Users} index={1} />
            <StatWidget label="In interview" value={data?.funnel?.interview ?? 0} icon={CalendarClock} index={2} />
            <StatWidget label="Interview pipeline" value={data?.interview_pipeline ?? 0} icon={CalendarClock} index={3} />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hiring funnel</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 18%)" vertical={false} />
              <XAxis dataKey="stage" stroke="hsl(240 5% 64%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(240 5% 64%)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <RTooltip
                cursor={{ fill: "hsl(240 7% 12% / 0.5)" }}
                contentStyle={{
                  background: "hsl(240 8% 8%)",
                  border: "1px solid hsl(240 6% 18%)",
                  borderRadius: 12,
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
