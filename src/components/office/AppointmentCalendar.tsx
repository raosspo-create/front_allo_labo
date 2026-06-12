'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  type EventPropGetter,
  type View,
} from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './appointment-calendar.css';
import { AppointmentCalendarToolbar } from '@/components/office/AppointmentCalendarToolbar';
import { AppointmentStatusLegend } from '@/components/office/AppointmentStatusLegend';
import {
  appointmentsToCalendarEvents,
  calendarRangeToApiParams,
  type CalendarEvent,
} from '@/lib/calendar-events';
import {
  type AppointmentEvent,
  appointmentStatusStyle,
} from '@/lib/appointment-types';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { fr },
});

const MESSAGES_FR = {
  date: 'Date',
  time: 'Heure',
  event: 'Rendez-vous',
  allDay: 'Journée',
  week: 'Semaine',
  work_week: 'Semaine ouvrée',
  day: 'Jour',
  month: 'Mois',
  previous: 'Précédent',
  next: 'Suivant',
  yesterday: 'Hier',
  tomorrow: 'Demain',
  today: 'Aujourd’hui',
  agenda: 'Agenda',
  noEventsInRange: 'Aucun rendez-vous sur cette période.',
  showMore: (total: number) => `+ ${total} de plus`,
};

const STATUS_EVENT_CLASS: Record<string, string> = {
  prise_en_compte: 'rbc-event--prise-en-compte',
  programme: 'rbc-event--programme',
  arrivee_patient: 'rbc-event--arrivee-patient',
  remise_centre: 'rbc-event--remise-centre',
  resultat_rendu: 'rbc-event--resultat-rendu',
};

type Props = {
  events: AppointmentEvent[];
  loading?: boolean;
  showTechnician?: boolean;
  onRangeChange: (from: string, to: string) => void;
  orderLinkPrefix?: string;
};

export function AppointmentCalendar({
  events,
  loading = false,
  showTechnician = false,
  onRangeChange,
  orderLinkPrefix = '/office/commandes',
}: Props) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  const calendarEvents = useMemo(
    () => appointmentsToCalendarEvents(events, { showTechnician }),
    [events, showTechnician],
  );

  const eventPropGetter: EventPropGetter<CalendarEvent> = (event) => {
    const status = event.resource?.status ?? '';
    const className = STATUS_EVENT_CLASS[status] ?? 'rbc-event--default';
    return { className };
  };

  function handleRangeChange(range: Date[] | { start: Date; end: Date }) {
    const { from, to } = calendarRangeToApiParams(range);
    onRangeChange(from, to);
  }

  return (
    <div className="appointment-calendar relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {loading ? (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-white/70 pt-24"
          aria-live="polite"
        >
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-md ring-1 ring-slate-200">
            Chargement des rendez-vous…
          </span>
        </div>
      ) : null}

      <AppointmentStatusLegend />

      <Calendar
        localizer={localizer}
        culture="fr"
        messages={MESSAGES_FR}
        events={calendarEvents}
        date={currentDate}
        view={currentView}
        onNavigate={(date) => setCurrentDate(date)}
        onView={(view) => setCurrentView(view)}
        onRangeChange={handleRangeChange}
        onSelectEvent={(event) => {
          router.push(`${orderLinkPrefix}/${event.id}`);
        }}
        eventPropGetter={eventPropGetter}
        components={{ toolbar: AppointmentCalendarToolbar }}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        popup
        selectable={false}
        views={['month', 'week', 'day', 'agenda']}
        style={{ height: 640 }}
      />
    </div>
  );
}

export function UnplannedAppointmentsList({
  items,
  loading,
}: {
  items: AppointmentEvent[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <p className="text-sm text-slate-500">Chargement des dossiers à planifier…</p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        Toutes les commandes prises en compte ont une date de rendez-vous.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-amber-200 bg-amber-50/40">
      {items.map((ev) => {
        const style = appointmentStatusStyle(ev.status);
        const clientName = ev.client
          ? `${ev.client.firstName} ${ev.client.lastName}`
          : '—';
        return (
          <li key={ev.id}>
            <Link
              href={`/office/commandes/${ev.id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition hover:bg-amber-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {ev.serviceName ?? 'Consultation'}
                </p>
                <p className="text-xs text-slate-600">{clientName}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${style.badge}`}>
                {style.label} · à planifier
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
