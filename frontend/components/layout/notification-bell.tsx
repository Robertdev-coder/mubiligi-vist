"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { Button } from "@/frontend/components/ui/button";
import { cn, formatDateTimeKigali } from "@/shared/utils";
import type { Notification } from "@/shared/types";

export function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { notifications: Notification[]; unread: number };
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // silent — polling will retry
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  async function markAll() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAll" }),
      });
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnread(0);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", id }),
    });
    setItems((current) => current.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    setUnread((value) => Math.max(0, value - 1));
    router.refresh();
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex size-10 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white ring-2 ring-white">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-navy">Notifications</p>
            <p className="text-[11px] text-slate-400">
              {unread > 0 ? `${unread} unread` : "You are all caught up"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAll}
            disabled={loading || unread === 0}
            className="h-8 px-2 text-[11px]"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
            Mark all
          </Button>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-slate-400">
              No notifications yet. New visit registrations will appear here.
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (!item.is_read) markOne(item.id);
                  if (item.registration_id) {
                    setOpen(false);
                    const base = window.location.pathname.startsWith("/dean")
                      ? "/dean/registrations"
                      : "/admin/registrations";
                    router.push(`${base}/${item.registration_id}`);
                  }
                }}
                className={cn(
                  "flex w-full flex-col gap-1 border-b border-line/60 px-4 py-3 text-left transition-colors hover:bg-surface",
                  !item.is_read && "bg-sky-50/60",
                )}
              >
                <span className="flex items-center gap-2">
                  {!item.is_read ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                  <span className="text-[13px] font-semibold text-navy">{item.title}</span>
                </span>
                <span className="line-clamp-2 text-xs leading-relaxed text-slate-500">{item.message}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  {formatDateTimeKigali(item.created_at)}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2 text-[10px] uppercase tracking-wide text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            Live updates
          </span>
          <span>Africa/Kigali</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
