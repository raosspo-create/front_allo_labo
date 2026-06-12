'use client';

import type { ReactNode } from 'react';
import { useToastFeedback } from '@/hooks/useToastFeedback';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function AdminReferentialAlerts({
  err,
  msg,
  onDismissErr: _onDismissErr,
  onDismissMsg: _onDismissMsg,
}: {
  err: string | null;
  msg: string | null;
  onDismissErr: () => void;
  onDismissMsg: () => void;
}) {
  useToastFeedback(err, msg);
  return null;
}

export function AdminReferentialHeader({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  icon: ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg [&_svg]:text-white">
              {icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
              <p className="mt-0.5 text-sm text-slate-600">{description}</p>
            </div>
          </div>
          <Button type="button" onClick={onAction}>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminReferentialDataCard({
  listTitle,
  listIcon,
  countLabel,
  children,
}: {
  listTitle: string;
  listIcon: ReactNode;
  countLabel: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-teal-600 [&_svg]:h-5 [&_svg]:w-5">{listIcon}</span>
          {listTitle}
          <span className="ml-auto text-sm font-normal text-slate-500">{countLabel}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="!px-0">
        <div className="max-h-[70vh] overflow-auto">{children}</div>
      </CardContent>
    </Card>
  );
}

/** En-têtes de colonnes alignés sur la page Utilisateurs. */
export const adminDataTableThClass =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600';
export const adminDataTableThRightClass =
  'px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600';

export const adminEditRowButtonClass =
  'inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50';

export const adminDeleteRowButtonClass =
  'inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50';
