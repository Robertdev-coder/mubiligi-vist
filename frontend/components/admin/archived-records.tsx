"use client";

import { ActionDialog } from "@/frontend/components/ui/action-dialog";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/frontend/components/ui/table";
import { purgeArchivedAction, restoreArchivedAction } from "@/backend/actions/records";
import { formatDateTimeKigali } from "@/shared/utils";
import type { ArchivedRecord } from "@/shared/types";

export function ArchivedRecords({
  records,
  canDelete,
}: {
  records: ArchivedRecord[];
  canDelete: boolean;
}) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Visitor</TableHead>
            <TableHead>Visit date</TableHead>
            <TableHead>Archived by</TableHead>
            <TableHead>Archived at</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell><Badge variant="neutral">{record.reference_code}</Badge></TableCell>
              <TableCell className="min-w-[150px] font-medium text-navy">{record.student_name}</TableCell>
              <TableCell className="min-w-[150px]">{record.visitor_name}</TableCell>
              <TableCell className="whitespace-nowrap">{record.visit_date}</TableCell>
              <TableCell className="whitespace-nowrap">{record.archived_by_name ?? "Unknown"}</TableCell>
              <TableCell className="whitespace-nowrap text-xs">{formatDateTimeKigali(record.archived_at)}</TableCell>
              <TableCell>
                <div className="flex min-w-[150px] justify-end gap-2">
                  <ActionDialog
                    trigger={<Button size="sm" variant="outline">Restore</Button>}
                    title="Restore archived record?"
                    description={`Restore registration ${record.reference_code} for ${record.student_name} to ordinary operational views.`}
                    confirmLabel="Restore record"
                    variant="success"
                    action={restoreArchivedAction}
                    hidden={{ archiveId: record.id }}
                  />
                  {canDelete ? (
                    <ActionDialog
                      trigger={<Button size="sm" variant="destructive">Delete permanently</Button>}
                      title="Permanently delete archived record?"
                      description={`This permanently removes archived registration ${record.reference_code}. This cannot be undone and may affect historical reporting.`}
                      confirmLabel="Delete permanently"
                      variant="destructive"
                      action={purgeArchivedAction}
                      hidden={{ archiveId: record.id }}
                    />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
