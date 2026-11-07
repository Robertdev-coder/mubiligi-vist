import { AlertTriangle } from "lucide-react";
import { Card } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import Link from "next/link";

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this information right now. Please refresh the page and try again.",
  showHome = true,
}: {
  title?: string;
  description?: string;
  showHome?: boolean;
}) {
  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
        <AlertTriangle className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {showHome ? (
        <Link href="/" className="mt-5 inline-block">
          <Button variant="outline" size="sm">
            Return home
          </Button>
        </Link>
      ) : null}
    </Card>
  );
}
