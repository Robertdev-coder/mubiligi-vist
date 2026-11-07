import type { Metadata } from "next";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";
import { todayKigali } from "@/shared/utils";
import { DashboardOverview } from "@/frontend/components/dashboard/overview";
import { ErrorState } from "@/frontend/components/ui/error-state";
import type { DashboardData } from "@/shared/types";

export const metadata: Metadata = { title: "Dean Dashboard" };
export const dynamic = "force-dynamic";

export default async function DeanDashboardPage() {
  const user = await requirePermission("dashboard.view");
  const date = todayKigali();

  let data: DashboardData;
  try {
    data = await backend.getDashboardData(date, user, false);
  } catch {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description="We could not load today's dashboard data. Check the database connection and try again."
      />
    );
  }

  return <DashboardOverview data={data} role="dean" userName={user.full_name} />;
}
