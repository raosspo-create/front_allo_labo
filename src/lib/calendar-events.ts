import type { AppointmentEvent } from '@/lib/appointment-types';

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

export type CalendarEventResource = AppointmentEvent;

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEventResource;
};

export function appointmentToCalendarEvent(
  ev: AppointmentEvent,
  options?: { showTechnician?: boolean },
): CalendarEvent | null {
  if (!ev.scheduledAt) return null;

  const start = new Date(ev.scheduledAt);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + DEFAULT_DURATION_MS);
  const service = ev.title ?? ev.serviceName ?? 'Consultation';
  const clientName = ev.subtitle
    ?? (ev.client ? `${ev.client.firstName} ${ev.client.lastName}`.trim() : '');
  const techName =
    ev.technicianName
    ?? (ev.technician
      ? `${ev.technician.firstName} ${ev.technician.lastName}`.trim()
      : '');

  let title = service;
  if (options?.showTechnician && clientName && techName) {
    title = `${service} — ${clientName} (${techName})`;
  } else if (options?.showTechnician && clientName) {
    title = `${service} — ${clientName}`;
  } else if (clientName && !options?.showTechnician) {
    title = `${service} — ${clientName}`;
  }

  return {
    id: ev.id,
    title,
    start,
    end,
    resource: ev,
  };
}

export function appointmentsToCalendarEvents(
  items: AppointmentEvent[],
  options?: { showTechnician?: boolean },
): CalendarEvent[] {
  return items
    .map((ev) => appointmentToCalendarEvent(ev, options))
    .filter((ev): ev is CalendarEvent => ev !== null);
}

export function calendarRangeToApiParams(
  range: Date[] | { start: Date; end: Date },
): { from: string; to: string } {
  let start: Date;
  let end: Date;

  if (Array.isArray(range)) {
    start = range[0] ?? new Date();
    end = range[range.length - 1] ?? start;
  } else {
    start = range.start;
    end = range.end;
  }

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return { from: format(start), to: format(end) };
}
