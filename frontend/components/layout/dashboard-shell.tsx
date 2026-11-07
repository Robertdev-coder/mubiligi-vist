"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Archive,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Brand } from "@/frontend/components/ui/brand";
import { Button } from "@/frontend/components/ui/button";
import { NotificationBell } from "@/frontend/components/layout/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { navItemsFor, SCHOOL, workspaceFor } from "@/shared/constants";
import { logoutAction } from "@/backend/auth/actions";
import { cn, initials } from "@/shared/utils";
import type { SessionUser } from "@/shared/types";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  ClipboardList,
  UserCheck,
  FileBarChart,
  Users,
  ScrollText,
  Archive,
  ShieldCheck,
  Settings,
};

function SidebarContent({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navItemsFor(user.permissions, user.role);
  const workspace = workspaceFor(user.role);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Brand href={workspace} variant="light" />
      </div>

      <div className="px-4 pt-5">
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sky/20 text-sky">
            <ShieldCheck className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">
              {user.role_name}
            </p>
            <p className="truncate text-[10px] text-sky-200/60">Staff workspace</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3" aria-label="Main navigation">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/40">
          Workspace
        </p>
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                active
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-sky-100/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition-colors",
                  active ? "bg-sky text-navy" : "bg-white/5 text-sky-200/70 group-hover:text-white",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {active ? <span className="size-1.5 rounded-full bg-sky" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-4">
          <p className="text-xs font-semibold text-white">MUBILIGI VISIT DAY</p>
          <p className="mt-1 text-[11px] leading-relaxed text-sky-200/60">
            {SCHOOL.name}
            <br />
            {SCHOOL.district}
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex text-[11px] font-semibold text-sky hover:text-white"
          >
            View public site →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({
  user,
  unread,
  children,
}: {
  user: SessionUser;
  unread: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const items = navItemsFor(user.permissions, user.role);
  const workspace = workspaceFor(user.role);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeItem = items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] bg-navy lg:block">
        <SidebarContent user={user} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-navy shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-sky-100/70 hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[264px]">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl border border-line bg-white text-slate-600 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {user.role_name}
              </p>
              <p className="truncate text-sm font-semibold text-navy">
                {activeItem?.label ?? "Dashboard"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.permissions.includes("registrations.create") ? (
              <Link href={`${workspace}/registrations/new`} className="hidden sm:block">
                <Button size="sm" variant="secondary">
                  <Plus />
                  Register visitor
                </Button>
              </Link>
            ) : user.permissions.includes("registrations.view") ? (
              <Link href={`${workspace}/registrations`} className="hidden sm:block">
                <Button size="sm" variant="secondary">
                  <ClipboardList />
                  Registrations
                </Button>
              </Link>
            ) : null}

            <NotificationBell initialUnread={unread} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-xl border border-line bg-white p-1 pr-2.5 shadow-sm transition-colors hover:border-primary/30"
                  aria-label="Account menu"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-navy text-[11px] font-bold text-white">
                    {initials(user.full_name)}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-xs font-semibold text-navy sm:block">
                    {user.full_name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate text-[13px] font-semibold text-navy">
                    {user.full_name}
                  </span>
                  <span className="block truncate text-[11px] font-normal text-slate-400">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={workspace}>
                    <LayoutDashboard />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <ShieldCheck />
                    Public website
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-red-600 outline-none transition-colors hover:bg-red-50"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>

        <footer className="no-print border-t border-line px-4 py-5 text-center text-[11px] text-slate-400 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {SCHOOL.name} · MUBILIGI VISIT DAY · All timestamps in Africa/Kigali
        </footer>
      </div>
    </div>
  );
}
