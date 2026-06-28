import { Construction } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";

export default function RecruiterGeneric({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} description="This workspace module is wired and ready for build-out." />
      <EmptyState
        icon={Construction}
        title={`${title} — coming together`}
        description="The data layer, API, and design system for this module are in place. UI build-out is in progress."
      />
    </>
  );
}
