import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";
import { RegistrationDetail } from "@/frontend/components/registrations/registration-detail";

export const metadata: Metadata = { title: "Registration details" };
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function DeanRegistrationDetailPage({ params }: { params: Params }) {
  await requirePermission("registrations.view");
  const { id } = await params;

  let registration;
  try {
    registration = await backend.getRegistrationById(id);
  } catch {
    notFound();
  }
  if (!registration) notFound();

  return <RegistrationDetail role="dean" registration={registration} />;
}
