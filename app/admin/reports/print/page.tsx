import type { Metadata } from "next";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";
import { DEFAULT_VISIT_DATE } from "@/shared/constants";
import { ErrorState } from "@/frontend/components/ui/error-state";
import { PrintRegister } from "@/frontend/components/reports/print-register";

export const metadata: Metadata = { title: "Print register" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPrintRegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePermission("reports.print");
  const raw = await searchParams;
  const date = pick(raw.date) ?? DEFAULT_VISIT_DATE;

  try {
    const [rows, visitDay] = await Promise.all([
      backend.getReportRows(date),
      backend.getVisitDayByDate(date),
    ]);
    return <PrintRegister role={user.role} date={date} rows={rows} visitDay={visitDay} />;
  } catch {
    return <ErrorState title="Could not build the print register" showHome={false} />;
  }
}
