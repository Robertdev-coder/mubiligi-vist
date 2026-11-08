import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckRegistrationForm } from "@/frontend/components/forms/check-registration-form";
import { Button } from "@/frontend/components/ui/button";
import { PageHeader } from "@/frontend/components/ui/page-header";

export const metadata: Metadata = {
  title: "Check registration",
  description: "Check a Visit Day registration using its reference and phone number.",
};

export default function CheckRegistrationPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Visit Day"
        title="Check your registration"
        description="Enter the registration reference and the phone number provided during registration."
        actions={
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft />
              Back
            </Button>
          </Link>
        }
      />
      <CheckRegistrationForm />
    </main>
  );
}
