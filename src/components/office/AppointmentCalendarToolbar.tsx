'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ToolbarProps, View } from 'react-big-calendar';
import type { CalendarEvent } from '@/lib/calendar-events';

const VIEW_LABELS: Record<string, string> = {
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
};

export function AppointmentCalendarToolbar({
  label,
  view,
  views,
  onNavigate,
  onView,
}: ToolbarProps<CalendarEvent>) {
  const viewOptions = (views as View[]).filter((v) => v !== 'work_week');

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-teal-50/80 via-white to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate('PREV')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
          aria-label="Période précédente"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onNavigate('TODAY')}
          className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50"
        >
          Aujourd’hui
        </button>
        <button
          type="button"
          onClick={() => onNavigate('NEXT')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
          aria-label="Période suivante"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <h2 className="text-center text-base font-bold capitalize tracking-tight text-slate-900 sm:text-lg">
        {label}
      </h2>

      <div className="flex flex-wrap justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1 sm:justify-end">
        {viewOptions.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onView(v)}
            className={[
              'rounded-md px-3 py-1.5 text-xs font-semibold transition sm:text-sm',
              view === v
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900',
            ].join(' ')}
          >
            {VIEW_LABELS[v] ?? v}
          </button>
        ))}
      </div>
    </div>
  );
}
