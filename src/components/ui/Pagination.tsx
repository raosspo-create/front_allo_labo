'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/lib/pagination';
import { pageRange } from '@/lib/pagination';

type PaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
  disabled?: boolean;
};

export function Pagination({
  meta,
  onPageChange,
  className = '',
  disabled = false,
}: PaginationProps) {
  const { page, totalPages, total, pageSize } = meta;

  if (totalPages <= 1) {
    return total > 0 ? (
      <p className={`text-sm text-slate-500 ${className}`}>
        {total} élément{total > 1 ? 's' : ''}
      </p>
    ) : null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = pageRange(page, totalPages);

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-sm text-slate-500">
        {from}–{to} sur {total}
      </p>
      <nav
        className="flex items-center gap-1"
        aria-label="Pagination"
      >
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        {pages[0] > 1 ? (
          <>
            <PageButton
              n={1}
              current={page}
              disabled={disabled}
              onPageChange={onPageChange}
            />
            {pages[0] > 2 ? (
              <span className="px-1 text-slate-400">…</span>
            ) : null}
          </>
        ) : null}
        {pages.map((n) => (
          <PageButton
            key={n}
            n={n}
            current={page}
            disabled={disabled}
            onPageChange={onPageChange}
          />
        ))}
        {pages[pages.length - 1] < totalPages ? (
          <>
            {pages[pages.length - 1] < totalPages - 1 ? (
              <span className="px-1 text-slate-400">…</span>
            ) : null}
            <PageButton
              n={totalPages}
              current={page}
              disabled={disabled}
              onPageChange={onPageChange}
            />
          </>
        ) : null}
        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </nav>
    </div>
  );
}

function PageButton({
  n,
  current,
  disabled,
  onPageChange,
}: {
  n: number;
  current: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}) {
  const active = n === current;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPageChange(n)}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'bg-teal-600 text-white shadow-sm'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {n}
    </button>
  );
}
