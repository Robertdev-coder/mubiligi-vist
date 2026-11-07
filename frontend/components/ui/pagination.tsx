"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/shared/utils";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  const pages: (number | "…")[] = [];
  const windowSize = 1;
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= windowSize) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line/70 px-4 py-3 sm:flex-row">
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-navy">{start}</span>–
        <span className="font-semibold text-navy">{end}</span> of{" "}
        <span className="font-semibold text-navy">{total}</span> records
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goTo(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        {pages.map((item, index) =>
          item === "…" ? (
            <span key={`ellipsis-${index}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => goTo(item)}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                item === page
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {item}
            </button>
          ),
        )}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goTo(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
