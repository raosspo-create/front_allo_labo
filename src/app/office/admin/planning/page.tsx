'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CalendarRange, Filter } from 'lucide-react';
import { useAuth } from '@/app/providers';
import {
  AppointmentCalendar,
  UnplannedAppointmentsList,
} from '@/components/office/AppointmentCalendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api/client';
import { fetchAllPaginatedItems } from '@/lib/pagination';
import { getNetworkErrorMessage } from '@/lib/api-errors';
import { monthApiRange } from '@/lib/calendar-utils';
import type { AppointmentEvent } from '@/lib/appointment-types';
import { adminFieldClass, adminLabelClass } from '@/components/admin/admin-form-styles';

type Agent = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
};

export default function AdminPlanningPage() {
  const { token } = useAuth();
  const [range, setRange] = useState(() => monthApiRange(new Date()));
  const [events, setEvents] = useState<AppointmentEvent[]>([]);
  const [unplanned, setUnplanned] = useState<AppointmentEvent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [technicianId, setTechnicianId] = useState('');
  const [loading, setLoading] = useState(true);
  const [unplannedLoading, setUnplannedLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    queueMicrotask(async () => {
      try {
        const users = await fetchAllPaginatedItems<Agent>((page, limit) =>
          apiFetch(`/users?page=${page}&limit=${limit}`, { method: 'GET', token }),
        );
        setAgents(
          users.filter((u) => u.role === 'technicien' || u.role === 'coursier'),
        );
      } catch {
        /* ignore */
      }
    });
  }, [token]);

  const loadCalendar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from: range.from, to: range.to });
      if (technicianId) params.set('technicianId', technicianId);
      const res = await apiFetch(`/orders/calendar?${params}`, {
        method: 'GET',
        token,
      });
      if (!res.ok) {
        setError('Impossible de charger le planning.');
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
  }, [token, range, technicianId]);

  const loadUnplanned = useCallback(async () => {
    if (!token) return;
    setUnplannedLoading(true);
    try {
      const params = new URLSearchParams({
        from: range.from,
        to: range.to,
        unplannedOnly: 'true',
      });
      if (technicianId) params.set('technicianId', technicianId);
      const res = await apiFetch(`/orders/calendar?${params}`, {
        method: 'GET',
        token,
      });
      if (!res.ok) {
        setUnplanned([]);
        return;
      }
      const data = (await res.json()) as AppointmentEvent[];
      setUnplanned(Array.isArray(data) ? data : []);
    } catch {
      setUnplanned([]);
    } finally {
      setUnplannedLoading(false);
    }
  }, [token, range, technicianId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadCalendar();
      void loadUnplanned();
    });
  }, [loadCalendar, loadUnplanned]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-14 pt-6 lg:px-8 lg:pb-16">
      <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <CalendarRange className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Planning global
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Vue d’ensemble des rendez-vous et des commandes prises en compte sans date fixée.
            </p>
          </div>
        </div>
        <Link
          href="/office/rendez-vous"
          className="text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
        >
          Vue personnelle
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="planning-tech" className={`${adminLabelClass} inline-flex items-center gap-1.5`}>
            <Filter className="h-3.5 w-3.5 text-teal-700" aria-hidden />
            Technicien / coursier
          </label>
          <select
            id="planning-tech"
            className={`${adminFieldClass} mt-1`}
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
          >
            <option value="">Tous les agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.firstName} {a.lastName} ({a.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Calendrier des rendez-vous</CardTitle>
            <CardDescription>
              Vues mois, semaine, jour et agenda. Couleurs selon le statut de la commande.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentCalendar
              events={events}
              loading={loading}
              showTechnician
              onRangeChange={(from, to) => setRange({ from, to })}
            />
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="bg-amber-50/50 pb-4">
            <CardTitle className="text-lg text-amber-950">À planifier</CardTitle>
            <CardDescription>
              Commandes « prise en compte » ou « programmées » sans date de rendez-vous — ouvrez la fiche
              pour fixer un créneau.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UnplannedAppointmentsList items={unplanned} loading={unplannedLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
