import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { Button } from "@/frontend/components/ui/button";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { ErrorState } from "@/frontend/components/ui/error-state";
import { StaffRegistrationForm } from "@/frontend/components/forms/staff-registration-form";

export const metadata: Metadata = { title: "New registration" };
export const dynamic = "force-dynamic";

export default async function AdminNewRegistrationPage() {
  const user = await requirePermission("registrations.create");

  let visitDays;
  try {
    visitDays = (await backend.listVisitDays()).filter((day) => day.is_active);
  } catch {
    return <ErrorState title="Could not load visit days" showHome={false} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Visit Day attendance"
        title="Register arriving parent"
        description="Record the parent at arrival. The system checks them in immediately and records the current server time."
        actions={
          <Link href="/admin/registrations">
            <Button variant="outline" size="sm">
              <ArrowLeft />
              Back to registrations
            </Button>
          </Link>
        }
      />

      {visitDays.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No active Visit Day"
          description="An Administrator must activate a Visit Day session before parents can be checked in."
          action={
            <Link href="/admin/settings">
              <Button size="sm">Manage visit days</Button>
            </Link>
          }
        />
      ) : (
        <StaffRegistrationForm visitDays={visitDays} actorId={user.id} />
      )}
    </div>
  );
}
