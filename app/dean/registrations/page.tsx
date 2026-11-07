import type { Metadata } from "next";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";
import { ErrorState } from "@/frontend/components/ui/error-state";
import {
  RegistrationsView,
  toRegistrationFilters,
  type RegistrationSearchParams,
} from "@/frontend/components/tables/registrations-view";

export const metadata: Metadata = { title: "Registrations" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function DeanRegistrationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("registrations.view");
  const raw = await searchParams;
  const params: RegistrationSearchParams = {
    search: pick(raw.search),
    status: pick(raw.status),
    trade: pick(raw.trade),
    level: pick(raw.level),
    date: pick(raw.date),
    attendance: pick(raw.attendance),
    class: pick(raw.class),
    page: pick(raw.page),
    sort: pick(raw.sort),
    direction: pick(raw.direction),
  };

  try {
    const data = await backend.listRegistrations(toRegistrationFilters(params));
    return <RegistrationsView role="dean" params={params} data={data} />;
  } catch {
    return <ErrorState title="Could not load registrations" showHome={false} />;
  }
}
