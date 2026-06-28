import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Briefcase, DollarSign, FileCheck, Users } from "lucide-react";
import { useAdminDashboard } from "@/api/hooks";
import { PageHeader } from "@/components/common/PageHeader";
import { StatWidget } from "@/components/common/StatWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Synthetic growth curve scaled to current totals (until a metrics service is wired).
function growthSeries(total: number) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((m, i) => ({
    month: m,
    users: Math.round((total / 6) * (i + 1) * (0.7 + Math.random() * 0.3)),
  }));
}

export default function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();
  const series = growthSeries(data?.total_users ?? 60);

  return (
    <>
      <PageHeader title="Platform overview" description="Growth, moderation, and revenue at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatWidget label="Total users" value={data?.total_users ?? 0} icon={Users} delta={12} index={0} />
            <StatWidget label="Jobs posted" value={data?.jobs_posted ?? 0} icon={Briefcase} delta={8} index={1} />
            <StatWidget
              label="Applications"
              value={data?.applications_submitted ?? 0}
              icon={FileCheck}
              delta={21}
              index={2}
            />
            <StatWidget
              label="Est. MRR"
              value={`$${data?.mrr_estimate ?? 0}`}
              icon={DollarSign}
              delta={5}
              index={3}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Platform growth</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(258 90% 66%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(258 90% 66%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 18%)" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(240 5% 64%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(240 5% 64%)" fontSize={12} tickLine={false} axisLine={false} />
                <RTooltip
                  contentStyle={{
                    background: "hsl(240 8% 8%)",
                    border: "1px solid hsl(240 6% 18%)",
                    borderRadius: 12,
                    color: "#fff",
                  }}
                />
                <Area type="monotone" dataKey="users" stroke="hsl(258 90% 66%)" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row label="Students" value={data?.students ?? 0} total={data?.total_users ?? 1} />
            <Row label="Recruiters" value={data?.recruiters ?? 0} total={data?.total_users ?? 1} />
            <Row label="Active users" value={data?.active_users ?? 0} total={data?.total_users ?? 1} />
            <Row label="Published jobs" value={data?.published_jobs ?? 0} total={data?.jobs_posted ?? 1} />
            <div className="rounded-lg glass-2 p-3 text-sm">
              <p className="text-muted-foreground">Pending company approvals</p>
              <p className="font-display text-2xl font-bold text-warning">
                {data?.pending_company_approvals ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = Math.round((value / Math.max(total, 1)) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-gradient-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
