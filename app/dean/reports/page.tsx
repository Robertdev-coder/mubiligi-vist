import type { Metadata } from "next";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";
import { DEFAULT_VISIT_DATE } from "@/shared/constants";
import { ErrorState } from "@/frontend/components/ui/error-state";
import { ReportsView } from "@/frontend/components/reports/reports-view";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DeanReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("reports.view");
  const raw = await searchParams;
  const date = pick(raw.date) ?? DEFAULT_VISIT_DATE;

  try {
    const [rows, summary] = await Promise.all([
      backend.getReportRows(date),
      backend.getRegistrationSummaryByStatus(),
    ]);
    return (
      <ReportsView
        role={user.role}
        date={date}
        rows={rows}
        summary={summary}
        canEmail={user.permissions.includes("reports.email")}
      />
    );
  } catch {
    return <ErrorState title="Could not load reports" showHome={false} />;
  }
}
