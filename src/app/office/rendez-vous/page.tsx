'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { AppointmentCalendar } from '@/components/office/AppointmentCalendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api/client';
import { getNetworkErrorMessage } from '@/lib/api-errors';
import { monthApiRange } from '@/lib/calendar-utils';
import type { AppointmentEvent } from '@/lib/appointment-types';
import { isStaffAdmin } from '@/lib/types/auth';
import { isFieldAgentRole } from '@/lib/order-permissions';

export default function RendezVousPage() {
  const { token, user } = useAuth();
  const [range, setRange] = useState(() => monthApiRange(new Date()));
  const [events, setEvents] = useState<AppointmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from: range.from, to: range.to });
      const res = await apiFetch(`/orders/calendar?${params}`, {
        method: 'GET',
        token,
      });
      if (!res.ok) {
        setError('Impossible de charger le calendrier.');
        setEvents([]);
        return;
      }
      const data = (await res.json()) as AppointmentEvent[];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getNetworkErrorMessage(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [token, range]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const subtitle = isFieldAgentRole(user?.role)
    ? 'Vos interventions planifiées (commandes qui vous sont affectées).'
    : isStaffAdmin(user?.role)
      ? 'Vue personnelle — consultez le planning global pour toutes les équipes.'
      : 'Vos consultations planifiées après prise en compte par le laboratoire.';

  return (
    <div className="mx-auto max-w-7xl px-4 pb-14 pt-6 lg:px-8 lg:pb-16">
      <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <CalendarDays className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Mes rendez-vous
            </h1>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>
        {isStaffAdmin(user?.role) ? (
          <Link
            href="/office/admin/planning"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
          >
            Planning global
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Calendrier</CardTitle>
          <CardDescription>
            Vues mois, semaine, jour et agenda. Cliquez sur un rendez-vous pour ouvrir la commande.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentCalendar
            events={events}
            loading={loading}
            showTechnician={isFieldAgentRole(user?.role)}
            onRangeChange={(from, to) => setRange({ from, to })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
