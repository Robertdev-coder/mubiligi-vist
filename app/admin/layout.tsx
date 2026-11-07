import { redirect } from "next/navigation";
import { requireUser } from "@/backend/auth/session";
import { DashboardShell } from "@/frontend/components/layout/dashboard-shell";
import { backend } from "@/backend/data";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role === "dean") redirect("/dean");
  let unread = 0;
  try {
    unread = await backend.unreadNotificationCount(user.id, true);
  } catch {
    unread = 0;
  }

  return (
    <DashboardShell user={user} unread={unread}>
      {children}
    </DashboardShell>
  );
}
