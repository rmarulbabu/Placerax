import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Inbox, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiErrorMessage } from "@/lib/api";

type View = "users" | "recruiters" | "companies" | "jobs" | "settings";

const config: Record<View, { title: string; desc: string }> = {
  users: { title: "User management", desc: "View and moderate every account on the platform." },
  recruiters: { title: "Recruiter verification", desc: "Approve recruiters so they can post jobs." },
  companies: { title: "Company approval", desc: "Review and approve company workspaces." },
  jobs: { title: "Job moderation", desc: "Approve or reject jobs awaiting moderation." },
  settings: { title: "Platform settings", desc: "Configure platform-wide controls." },
};

export default function AdminQueues({ view }: { view: View }) {
  const c = config[view];
  if (view === "settings") {
    return (
      <>
        <PageHeader title={c.title} description={c.desc} />
        <EmptyState icon={Settings2} title="Settings" description="Platform configuration controls live here." />
      </>
    );
  }
  return (
    <>
      <PageHeader title={c.title} description={c.desc} />
      {view === "users" && <UsersTable />}
      {view === "recruiters" && <RecruiterQueue />}
      {view === "companies" && <CompanyQueue />}
      {view === "jobs" && <JobQueue />}
    </>
  );
}

function UsersTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () =>
      (await api.get<{ items: { id: string; full_name: string; email: string; role: string; status: string }[] }>(
        "/admin/users",
      )).data,
  });
  if (isLoading) return <Skeleton className="h-64" />;
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {data?.items.map((u) => (
            <tr key={u.id} className="hover:bg-surface-2/40">
              <td className="px-4 py-3 font-medium">{u.full_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-3">
                <Badge variant="muted" className="capitalize">
                  {u.role}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={u.status === "active" ? "success" : "warning"} className="capitalize">
                  {u.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function QueueList({
  queryKey,
  endpoint,
  approveEndpoint,
  render,
  emptyLabel,
}: {
  queryKey: string[];
  endpoint: string;
  approveEndpoint: (id: string) => string;
  render: (item: any) => { id: string; title: string; subtitle: string };
  emptyLabel: string;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => (await api.get<any[]>(endpoint)).data,
  });
  const decide = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.post(approveEndpoint(id), { approve }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Decision recorded.");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (isLoading) return <Skeleton className="h-48" />;
  if (!data?.length) return <EmptyState icon={Inbox} title="Queue is empty" description={emptyLabel} />;

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const r = render(item);
        return (
          <Card key={r.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium">{r.title}</p>
              <p className="truncate text-sm text-muted-foreground">{r.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={() => decide.mutate({ id: r.id, approve: false })}>
                <X className="size-4" /> Reject
              </Button>
              <Button size="sm" onClick={() => decide.mutate({ id: r.id, approve: true })}>
                <Check className="size-4" /> Approve
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

const RecruiterQueue = () => (
  <QueueList
    queryKey={["admin", "recruiters"]}
    endpoint="/admin/recruiters/pending"
    approveEndpoint={(id) => `/admin/recruiters/${id}/verify`}
    render={(item) => ({ id: item.id, title: item.title ?? "Recruiter", subtitle: `User ${item.user_id?.slice(-6)}` })}
    emptyLabel="No recruiters awaiting verification."
  />
);

const CompanyQueue = () => (
  <QueueList
    queryKey={["admin", "companies"]}
    endpoint="/admin/companies/pending"
    approveEndpoint={(id) => `/admin/companies/${id}/approve`}
    render={(item) => ({ id: item.id, title: item.name, subtitle: item.industry ?? "—" })}
    emptyLabel="No companies awaiting approval."
  />
);

const JobQueue = () => (
  <QueueList
    queryKey={["admin", "jobs"]}
    endpoint="/admin/jobs/moderation"
    approveEndpoint={(id) => `/admin/jobs/${id}/moderate`}
    render={(item) => ({ id: item.id, title: item.title, subtitle: `${item.type} · ${item.workplace}` })}
    emptyLabel="No jobs awaiting moderation."
  />
);
