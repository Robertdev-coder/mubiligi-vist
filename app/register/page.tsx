import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { backend } from "@/backend/data";
import { ErrorState } from "@/frontend/components/ui/error-state";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { RegistrationForm } from "@/frontend/components/forms/registration-form";

export const metadata: Metadata = { title: "Register your visit" };
export const dynamic = "force-dynamic";

export default async function PublicRegistrationPage() {
  let visitDays;
  try {
    visitDays = await backend.getActiveVisitDays();
  } catch {
    return <ErrorState title="Could not load visit days" showHome />;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Visitor registration"
        title="Register your visit"
        description="Submit your visit details ahead of time. If your connection drops after this page loads, you can save the registration on this device and it will sync when you reconnect."
        actions={
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft />
              Back
            </Button>
          </Link>
        }
      />
      {visitDays.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Registration is not open"
          description="There are no active visit days currently open for registration. Please try again later."
        />
      ) : (
        <Card className="p-5 sm:p-8">
          <RegistrationForm visitDays={visitDays} />
        </Card>
      )}
    </main>
  );
}
