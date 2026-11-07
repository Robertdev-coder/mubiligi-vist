import { requireRole } from "@/backend/auth/session";
import { DashboardShell } from "@/frontend/components/layout/dashboard-shell";
import { backend } from "@/backend/data";

export const dynamic = "force-dynamic";

export default async function DeanLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["dean"]);
  let unread = 0;
  try {
    unread = await backend.unreadNotificationCount(user.id, false);
  } catch {
    unread = 0;
  }

  return (
    <DashboardShell user={user} unread={unread}>
      {children}
    </DashboardShell>
  );
}
