import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";

export default async function RegistrationSuccessPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  return (
    <main className="hero-gradient flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg space-y-5 p-7 text-center sm:p-10">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-semibold text-navy">Registration received</h1>
          <p className="mt-2 text-sm text-muted">
            Keep this reference to check your registration with school staff.
          </p>
        </div>
        <p className="rounded-xl bg-surface px-4 py-3 font-mono text-lg font-semibold text-navy">
          {reference}
        </p>
        <Link href="/">
          <Button>Return to home</Button>
        </Link>
      </Card>
    </main>
  );
}
