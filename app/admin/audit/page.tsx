import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { Card } from "@/frontend/components/ui/card";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { ErrorState } from "@/frontend/components/ui/error-state";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { Badge } from "@/frontend/components/ui/badge";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";
import { formatDateTimeKigali } from "@/shared/utils";

export const metadata: Metadata = { title: "Audit logs" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requirePermission("audit.view");

  try {
    const logs = await backend.listAuditLogs(250);
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Administration"
          title="Audit logs"
          description="Review recent administrative actions. Audit history is read-only and retained independently of user accounts."
        />
        {logs.length === 0 ? (
          <EmptyState icon={Activity} title="No activity recorded" description="Administrative actions will appear here." />
        ) : (
          <Card>
            <div className="divide-y divide-line">
              {logs.map((log) => (
                <article key={log.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-navy">{log.action.replace(/[._]/g, " ")}</h2>
                      <Badge variant={log.status === "success" ? "success" : "danger"}>{log.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {log.actor_name ?? "System"} · {log.entity_type}{log.entity_id ? ` · ${log.entity_id}` : ""}
                    </p>
                    {log.details ? <p className="mt-1 break-words text-xs text-slate-600">{log.details}</p> : null}
                  </div>
                  <time className="whitespace-nowrap text-[11px] text-slate-400">{formatDateTimeKigali(log.created_at)}</time>
                </article>
              ))}
            </div>
            <p className="border-t border-line px-5 py-3 text-xs text-slate-500">Showing the latest {logs.length} entries</p>
          </Card>
        )}
      </div>
    );
  } catch {
    return <ErrorState title="Could not load audit logs" showHome={false} />;
  }
}
