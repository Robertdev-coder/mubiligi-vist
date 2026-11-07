"use client";

import { Activity, CalendarDays, Users } from "lucide-react";
import { Card } from "@/frontend/components/ui/card";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { VisitDaysPanel } from "@/frontend/components/settings/visit-days-panel";
import { StaffPanel } from "@/frontend/components/settings/staff-panel";
import { formatDateTimeKigali } from "@/shared/utils";
import type { AuditLog, Profile, VisitDay } from "@/shared/types";

const ACTION_LABEL: Record<string, string> = {
  "staff.created": "Staff account created",
  "staff.role_changed": "Staff role changed",
  "staff.activated": "Staff account activated",
  "staff.deactivated": "Staff account deactivated",
  "visit_day.created": "Visit day created",
  "visit_day.updated": "Visit day updated",
  "visit_day.activated": "Registration opened",
  "visit_day.deactivated": "Registration closed",
};

function AuditPanel({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No recent activity"
        description="Changes to visit days and staff access will appear here."
      />
    );
  }

  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-semibold text-navy">Recent activity</h2>
      <p className="text-xs text-muted">The latest changes made by administrators.</p>
      <ol className="mt-4 space-y-4 border-l border-line pl-4">
        {logs.map((log) => (
          <li key={log.id} className="relative">
            <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-sky-soft" />
            <p className="text-[12px] font-semibold text-navy">
              {ACTION_LABEL[log.action] ?? log.action}
            </p>
            {log.details ? (
              <p className="text-[12px] text-slate-500">{log.details}</p>
            ) : null}
            <p className="mt-0.5 text-[11px] text-slate-400">
              {log.actor_name ?? "System"} · {formatDateTimeKigali(log.created_at)}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function SettingsView({
  visitDays,
  staff,
  currentUserId,
  auditLogs,
}: {
  visitDays: VisitDay[];
  staff: Profile[];
  currentUserId: string;
  auditLogs: AuditLog[];
}) {
  return (
    <Tabs defaultValue="visit-days">
      <TabsList>
        <TabsTrigger value="visit-days">
          <CalendarDays className="mr-1.5 size-3.5" />
          Visit days
        </TabsTrigger>
        <TabsTrigger value="staff">
          <Users className="mr-1.5 size-3.5" />
          Staff access
        </TabsTrigger>
        <TabsTrigger value="activity">
          <Activity className="mr-1.5 size-3.5" />
          Activity log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="visit-days">
        <VisitDaysPanel visitDays={visitDays} />
      </TabsContent>
      <TabsContent value="staff">
        <StaffPanel staff={staff} currentUserId={currentUserId} />
      </TabsContent>
      <TabsContent value="activity">
        <AuditPanel logs={auditLogs} />
      </TabsContent>
    </Tabs>
  );
}
