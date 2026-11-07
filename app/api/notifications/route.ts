import { NextResponse } from "next/server";
import { getSessionUser } from "@/backend/auth/session";
import { backend } from "@/backend/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const includeAll = user.role === "admin";
  const [notifications, unread] = await Promise.all([
    backend.listNotifications(user.id, includeAll, 25),
    backend.unreadNotificationCount(user.id, includeAll),
  ]);

  return NextResponse.json({ notifications, unread });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { action?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const includeAll = user.role === "admin";

  if (body.action === "markAll") {
    await backend.markAllNotificationsRead(user.id, includeAll);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "read" && body.id) {
    await backend.markNotificationRead(body.id, user.id, includeAll);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
