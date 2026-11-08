import { NextResponse } from "next/server";
import { z } from "zod";
import { backend } from "@/backend/data";
import { registrationSchema } from "@/shared/validation/schemas";

const publicRegistrationSchema = z.object({
  type: z.literal("public_registration").optional(),
  operationId: z.string().uuid(),
  input: registrationSchema,
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const parsed = publicRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid registration." },
      { status: 400 },
    );
  }
  if (parsed.data.website) return NextResponse.json({ reference: "" });

  try {
    const registration = await backend.createRegistration(parsed.data.input, {
      status: "pending",
      syncOperationId: parsed.data.operationId,
    });
    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not submit the registration." },
      { status: 409 },
    );
  }
}
