import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/backend/auth/session";
import { backend } from "@/backend/data";
import { registrationSchema } from "@/shared/validation/schemas";

const checkInSchema = z.object({
  type: z.literal("check_in"),
  actorId: z.string().uuid(),
  operationId: z.string().uuid(),
  departureOperationId: z.string().uuid(),
  input: registrationSchema,
  arrivalAt: z.string().datetime(),
  arrivalTimezone: z.string().min(1).max(80),
  departureAt: z.string().datetime().optional(),
  departureTimezone: z.string().min(1).max(80).optional(),
});

const goneSchema = z
  .object({
    type: z.literal("gone"),
    operationId: z.string().uuid(),
    actorId: z.string().uuid(),
    registrationId: z.string().uuid().optional(),
    registrationOperationId: z.string().uuid().optional(),
    departureAt: z.string().datetime(),
    departureTimezone: z.string().min(1).max(80),
  })
  .refine((value) => Boolean(value.registrationId) !== Boolean(value.registrationOperationId));

const syncSchema = z.discriminatedUnion("type", [checkInSchema, goneSchema]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid sync operation." }, { status: 400 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (
    !user.permissions.includes("registrations.create") ||
    !user.permissions.includes("attendance.create") ||
    !user.permissions.includes("attendance.edit")
  ) {
    return NextResponse.json({ error: "You cannot synchronize attendance records." }, { status: 403 });
  }
  if (parsed.data.actorId !== user.id) {
    return NextResponse.json(
      { error: "Sign in with the account that created this offline record." },
      { status: 403 },
    );
  }

  try {
    if (parsed.data.type === "check_in") {
      const { operationId, departureOperationId, input, arrivalAt, arrivalTimezone, departureAt, departureTimezone } = parsed.data;
      const existing = await backend.getRegistrationBySyncOperationId(operationId);
      if (existing) {
        if (departureAt) {
          await backend.recordDeparture(
            existing.id,
            user.id,
            departureAt,
            departureOperationId,
            departureTimezone,
          );
        }
        return NextResponse.json({ id: existing.id, reference: existing.reference });
      }

      const registration = await backend.createRegistration(input, {
        actorId: user.id,
        status: "confirmed",
        bypassWindow: true,
        markArrived: true,
        arrivalAt,
        arrivalTimezone,
        arrivalSource: "device",
        departureAt,
        departureTimezone,
        departureSource: departureAt ? "device" : undefined,
        departureOperationId,
        syncedAt: new Date().toISOString(),
        syncOperationId: operationId,
      });
      return NextResponse.json(registration);
    }

    const { registrationId, registrationOperationId, departureAt, operationId, departureTimezone } = parsed.data;
    const registration = registrationId
      ? { id: registrationId }
      : await backend.getRegistrationBySyncOperationId(registrationOperationId!);
    if (!registration) return NextResponse.json({ error: "The synced check-in was not found." }, { status: 404 });

    await backend.recordDeparture(registration.id, user.id, departureAt, operationId, departureTimezone);
    return NextResponse.json({ id: registration.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not synchronize this record." },
      { status: 409 },
    );
  }
}
