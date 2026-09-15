"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const DEFAULT_ADMIN_PAGE_SIZE = 10;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

/** Build a compact list of page numbers with ellipsis markers (`"…"`). */
export function buildPageItems(
  page: number,
  pageCount: number
): (number | "…")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const items: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  if (start > 2) items.push("…");
  for (let n = start; n <= end; n += 1) items.push(n);
  if (end < pageCount - 1) items.push("…");
  items.push(pageCount);

  return items;
}

export function useClientPagination<T>(
  items: T[],
  pageSize: number = DEFAULT_ADMIN_PAGE_SIZE,
  resetKey?: string | number
) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const meta: PaginationMeta = {
    page: safePage,
    pageSize,
    pageCount,
    total,
  };

  return {
    page: safePage,
    setPage,
    pageItems,
    meta,
    showPagination: total > pageSize,
  };
}

type PaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  disabled?: boolean;
};

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  className,
  disabled = false,
}: PaginationProps) {
  if (total === 0 || pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = buildPageItems(page, pageCount);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        {from}–{to} sur {total}
      </p>

      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center gap-1"
      >
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          aria-label="Page précédente"
        >
          <ChevronLeft className="size-4" />
        </button>

        {pages.map((item, index) =>
          item === "…" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex size-9 items-center justify-center text-sm text-muted-foreground"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-xl text-sm font-medium tabular-nums transition disabled:pointer-events-none disabled:opacity-40",
                item === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:bg-accent"
              )}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          disabled={disabled || page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          aria-label="Page suivante"
        >
          <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  );
}
