'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/providers';
import { buttonClassName } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api/client';
import { buildPageQuery, parsePaginatedResponse } from '@/lib/pagination';
import { getNetworkErrorMessage } from '@/lib/api-errors';
import { orderStatusBadgeClass, orderStatusLabel } from '@/lib/order-status';

type OrderRow = {
  id: string;
  status: string;
  amount?: string | null;
  createdAt?: string;
  client?: {
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  zone?: {
    name: string;
    code?: string;
  } | null;
};

export default function OfficeDashboardPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | undefined>(undefined);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setOrders(undefined);
    try {
      const res = await apiFetch(
        `/orders${buildPageQuery({ page: 1, limit: 8 })}`,
        { method: 'GET', token },
      );
      if (res.status === 401) {
        setError('Session expirée. Reconnectez-vous.');
        setOrders([]);
        return;
      }
      if (!res.ok) {
        setError('Impossible de charger les commandes.');
        setOrders([]);
        return;
      }
      const data = await parsePaginatedResponse<OrderRow>(res);
      setOrders(data.items);
      setOrdersTotal(data.meta.total);
      setStatusCounts(data.meta.statusCounts ?? {});
    } catch (err) {
      setError(getNetworkErrorMessage(err));
      setOrders([]);
    }
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const stats = useMemo(() => {
    if (!orders) return null;
    const done = statusCounts.resultat_rendu ?? 0;
    const cancelled = statusCounts.annule ?? 0;
    const pipeline = Math.max(0, ordersTotal - done - cancelled);
    return { total: ordersTotal, pipeline, done, cancelled };
  }, [orders, ordersTotal, statusCounts]);

  const recent = useMemo(() => {
    if (!orders?.length) return [];
    return [...orders]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 5);
  }, [orders]);

  const roleDisplay = user?.role?.replace('_', ' ') ?? '';

  return (
    <div className="mx-auto max-w-7xl px-4 pb-14 pt-6 lg:px-8 lg:pb-16">
      <div className="flex flex-col gap-4 pb-8 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Tableau de bord
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {user ? ` — ${user.firstName} ${user.lastName}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void load()} className={buttonClassName('secondary')}>
            Actualiser
          </button>
          <Link href="/services" className={buttonClassName('primary')}>
            Catalogue
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {orders === undefined ? (
        <p className="mt-10 text-sm text-slate-500">Chargement du tableau de bord…</p>
      ) : stats ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="relative overflow-hidden border-l-4 border-l-teal-500 shadow-sm">
              <CardHeader className="!py-5">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total dossiers
                </CardTitle>
                <p className="mt-3 text-4xl font-bold tabular-nums text-slate-900">
                  {stats.total}
                </p>
                <p className="mt-2 text-xs text-teal-700">
                  <span className="font-semibold">+{stats.total > 0 ? Math.round((stats.total / 100) * 100) : 0}%</span>
                  {' '}depuis le début
                </p>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-cyan-500 shadow-sm">
              <CardHeader className="!py-5">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  En parcours
                </CardTitle>
                <p className="mt-3 text-4xl font-bold tabular-nums text-slate-900">
                  {stats.pipeline}
                </p>
                <p className="mt-2 text-xs text-cyan-700">
                  <span className="font-semibold">
                    {stats.total > 0 ? Math.round((stats.pipeline / stats.total) * 100) : 0}%
                  </span>
                  {' '}en traitement
                </p>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-amber-500 shadow-sm">
              <CardHeader className="!py-5">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Terminées
                </CardTitle>
                <p className="mt-3 text-4xl font-bold tabular-nums text-slate-900">
                  {stats.done}
                </p>
                <p className="mt-2 text-xs text-green-700">
                  <span className="font-semibold">
                    {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%
                  </span>
                  {' '}taux de réussite
                </p>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-red-500 shadow-sm">
              <CardHeader className="!py-5">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Annulées
                </CardTitle>
                <p className="mt-3 text-4xl font-bold tabular-nums text-slate-900">
                  {stats.cancelled}
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  <span className="font-semibold">
                    {stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0}%
                  </span>
                  {' '}du total
                </p>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-8">
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 bg-white pb-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Commandes récentes</CardTitle>
                  <CardDescription className="mt-1">Dernières admissions des 24 dernières heures</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Link href="/office/commandes" className={`${buttonClassName('secondary')} !px-4 !py-2 !text-sm`}>
                    Voir tout
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="!px-0 !pb-0 !pt-0">
                {recent.length === 0 ? (
                  <p className="px-6 py-12 text-center text-sm text-slate-600">
                    Aucune commande pour le moment.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-y border-slate-100 bg-slate-50/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Référence
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Zone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Montant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Date création
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Statut
                          </th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {recent.map((o) => (
                          <tr key={o.id} className="transition hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm font-semibold text-teal-700">
                                {o.id.slice(0, 8)}…
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {o.client ? (
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {o.client.firstName} {o.client.lastName}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {o.zone ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {o.zone.name}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-slate-900">
                                {o.amount ? `${o.amount} XOF` : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600">
                                {o.createdAt ? new Date(o.createdAt).toLocaleString('fr-FR', { 
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${orderStatusBadgeClass(o.status)}`}>
                                {orderStatusLabel(o.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link
                                href={`/office/commandes/${o.id}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                aria-label="Voir détails"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </>
      ) : null}
    </div>
  );
}
