'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Clock3 } from 'lucide-react';
import { adminFieldClass } from '@/components/admin/admin-form-styles';
import { apiFetch } from '@/lib/api/client';
import { monthApiRange } from '@/lib/calendar-utils';
import {
  buildTakenSlotKeys,
  buildTimeSlotOptions,
  joinDatetimeLocal,
  slotKeyFromParts,
  splitDatetimeLocal,
  todayYmd,
  type BookedSlot,
} from '@/lib/appointment-slots';

type Props = {
  id?: string;
  token: string | null;
  orderId: string;
  /** Créneaux bloqués uniquement pour ce technicien / coursier. */
  technicianId?: string | null;
  technicianName?: string | null;
  value: string;
  onChange: (datetimeLocal: string) => void;
  disabled?: boolean;
  className?: string;
};

export function AppointmentSlotPicker({
  id,
  token,
  orderId,
  technicianId,
  technicianName,
  value,
  onChange,
  disabled = false,
  className = '',
}: Props) {
  const { date, time } = splitDatetimeLocal(value);
  const [bookings, setBookings] = useState<BookedSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBookings = useCallback(async () => {
    if (!token || !technicianId) {
      setBookings([]);
      return;
    }
    const anchor = date ? new Date(`${date}T12:00:00`) : new Date();
    const { from, to } = monthApiRange(anchor);
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to, technicianId });
      const res = await apiFetch(`/orders/booked-slots?${params}`, {
        method: 'GET',
        token,
      });
      if (!res.ok) {
        setBookings([]);
        return;
      }
      const data = (await res.json()) as BookedSlot[];
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [token, date, technicianId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadBookings();
    });
  }, [loadBookings]);

  const takenKeys = useMemo(
    () => (technicianId ? buildTakenSlotKeys(bookings, orderId) : new Set<string>()),
    [bookings, orderId, technicianId],
  );

  const timeOptions = buildTimeSlotOptions();
  const availableCount =
    technicianId && date
      ? timeOptions.filter((opt) => !takenKeys.has(slotKeyFromParts(date, opt.value))).length
      : timeOptions.length;

  const selectedTaken =
    technicianId && date && time
      ? takenKeys.has(slotKeyFromParts(date, time))
      : false;

  const techLabel = technicianName?.trim() || 'ce technicien';

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {!technicianId ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Affectez d&apos;abord un technicien pour bloquer les créneaux déjà pris sur son planning.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[10rem] flex-1">
          <label
            htmlFor={id ? `${id}-date` : undefined}
            className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700"
          >
            <Calendar className="h-3.5 w-3.5 text-teal-700" aria-hidden />
            Date
          </label>
          <input
            id={id ? `${id}-date` : undefined}
            type="date"
            min={todayYmd()}
            value={date}
            disabled={disabled || loading}
            onChange={(e) => {
              const nextDate = e.target.value;
              const nextTime =
                time && !takenKeys.has(slotKeyFromParts(nextDate, time))
                  ? time
                  : buildTimeSlotOptions().find(
                      (opt) => !takenKeys.has(slotKeyFromParts(nextDate, opt.value)),
                    )?.value ?? '';
              onChange(joinDatetimeLocal(nextDate, nextTime));
            }}
            className={adminFieldClass}
          />
        </div>
        <div className="min-w-[8rem] flex-1">
          <label
            htmlFor={id ? `${id}-time` : undefined}
            className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-700"
          >
            <Clock3 className="h-3.5 w-3.5 text-teal-700" aria-hidden />
            Heure
          </label>
          <select
            id={id ? `${id}-time` : undefined}
            value={time}
            disabled={disabled || loading || !date}
            onChange={(e) => onChange(joinDatetimeLocal(date, e.target.value))}
            className={adminFieldClass}
          >
            <option value="">— Choisir —</option>
            {timeOptions.map((opt) => {
              const taken =
                technicianId && date
                  ? takenKeys.has(slotKeyFromParts(date, opt.value))
                  : false;
              return (
                <option key={opt.value} value={opt.value} disabled={taken}>
                  {taken ? `${opt.label} (indisponible)` : opt.label}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      {technicianId && date && availableCount === 0 ? (
        <p className="text-xs font-medium text-amber-800">
          Aucun créneau disponible ce jour pour {techLabel} — choisissez une autre date.
        </p>
      ) : null}
      {selectedTaken ? (
        <p className="text-xs font-medium text-red-700">
          Ce créneau est déjà réservé pour {techLabel}. Choisissez une autre heure.
        </p>
      ) : null}
      {loading ? (
        <p className="text-xs text-slate-500">Chargement des créneaux…</p>
      ) : (
        <p className="text-xs text-slate-500">
          Créneaux de 30 min (8h–18h).
          {technicianId
            ? ` Les horaires déjà pris par ${techLabel} sont indisponibles.`
            : ' Les conflits seront vérifiés une fois le technicien affecté.'}
        </p>
      )}
    </div>
  );
}
