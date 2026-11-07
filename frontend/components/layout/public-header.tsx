"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Search } from "lucide-react";
import { Brand } from "@/frontend/components/ui/brand";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/shared/utils";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#visit-day", label: "Visit day" },
  { href: "/#instructions", label: "Instructions" },
  { href: "/#contact", label: "Contact" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-navy/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand variant="light" />

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-sky-100/75 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/check-registration">
            <Button variant="ghost" size="sm" className="text-sky-100/80 hover:bg-white/10 hover:text-white">
              <Search />
              Check registration
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              Staff login
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-white text-navy hover:bg-sky-50">
              Register visit
              <ArrowRight />
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex size-10 items-center justify-center rounded-xl border border-white/15 text-white lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-white/10 bg-navy/95 transition-all duration-300 lg:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0",
        )}
      >
        <div className="space-y-1 px-4 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-sky-100/80 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-3">
            <Link href="/check-registration" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                Check registration
              </Button>
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                Staff login
              </Button>
            </Link>
          </div>
          <Link href="/register" onClick={() => setOpen(false)} className="block pt-2">
            <Button size="sm" className="w-full bg-white text-navy hover:bg-sky-50">
              Register your visit
              <ArrowRight />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
