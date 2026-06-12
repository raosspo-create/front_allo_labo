'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import {
  CatalogueCompareChart,
  KpiHero,
  OrderActivityBar,
  OrderPipelineBar,
  OrderStatusDonut,
  TeamRolesBar,
  UsageCompositionChart,
} from '@/components/statistics/StatsDashboardCharts';
import { buttonClassName } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api/client';
import { getNetworkErrorMessage } from '@/lib/api-errors';
import { formatXof } from '@/lib/statistics-labels';
import { isStaffAdmin } from '@/lib/types/auth';

type Dashboard = {
  orders?: {
    total: number;
    createdLastDays30: number;
    byStatus: Record<string, number>;
    revenue?: {
      sumAmountExcludingCancelled: string | null;
      currencyApproximation?: string;
      cancelledOrderCount?: number;
    };
  };
  users?: {
    total: number;
    activeClients: number;
    byRole: Record<string, number>;
  };
  catalogues?: Record<string, number>;
  catalogue?: Record<string, number>;
  usage?: Record<string, number | null>;
  orderComposition?: Record<string, number | null>;
  generatedAt?: string;
};

export default function StatistiquesPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [data, setData] = useState<Dashboard | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isStaffAdmin(user.role)) {
      router.replace('/office');
    }
  }, [user, router]);

  useEffect(() => {
    if (!token || !isStaffAdmin(user?.role)) {
      return;
    }
    let cancelled = false;
    queueMicrotask(async () => {
      try {
        const res = await apiFetch('/statistiques', { method: 'GET', token });
        if (cancelled) return;
        if (res.status === 403 || res.status === 401) {
          setError('Accès réservé aux super administrateurs.');
          setData(null);
          return;
        }
        if (!res.ok) {
          setError('Impossible de charger les statistiques.');
          setData(null);
          return;
        }
        setData((await res.json()) as Dashboard);
      } catch (err) {
        if (!cancelled) {
          setError(getNetworkErrorMessage(err));
          setData(null);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token, user?.role]);

  if (!isStaffAdmin(user?.role)) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-slate-500">
        Redirection…
      </div>
    );
  }

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-slate-500">
        Agrégation des métriques en cours…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
        <Card className="border-red-100 bg-red-50/80">
          <CardContent className="py-6 text-sm text-red-900">{error}</CardContent>
        </Card>
        <Link href="/office" className={`${buttonClassName('secondary')} mt-8 inline-flex`}>
          Retour accueil
        </Link>
      </div>
    );
  }

  if (!data?.orders) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-600">
            Aucune donnée disponible.
          </CardContent>
        </Card>
      </div>
    );
  }

  const orders = data.orders;
  const users = data.users;
  const catalogue = (data.catalogues ?? data.catalogue ?? {}) as Parameters<
    typeof CatalogueCompareChart
  >[0]['catalogue'];
  const usage = (data.usage ?? data.orderComposition ?? {}) as Parameters<
    typeof UsageCompositionChart
  >[0]['usage'];
  const revenue = formatXof(orders.revenue?.sumAmountExcludingCancelled);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-4 lg:px-8">
      <div className="mb-6 overflow-hidden rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 px-5 py-6 text-white shadow-lg sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-200/90">
              Tableau de bord
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Statistiques & Indicateurs
            </h1>
            <p className="mt-2 max-w-xl text-sm text-teal-50/90">
              Synthèse visuelle des commandes, de l’équipe et du catalogue — graphiques
              interactifs mis à jour à chaque chargement.
            </p>
          </div>
          <Link
            href="/office"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Retour accueil
          </Link>
        </div>
        {data.generatedAt ? (
          <p className="mt-4 text-[11px] text-teal-100/70">
            Dernière mise à jour :{' '}
            {new Date(data.generatedAt).toLocaleString('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        ) : null}
      </div>

      <div className="space-y-6">
        <KpiHero orders={orders} users={users} revenue={revenue} />

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
            Commandes
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <OrderStatusDonut byStatus={orders.byStatus} total={orders.total} />
            <OrderPipelineBar byStatus={orders.byStatus} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <OrderActivityBar total={orders.total} last30={orders.createdLastDays30} />
            {usage ? (
              <UsageCompositionChart usage={usage} ordersTotal={orders.total} />
            ) : null}
          </div>
        </section>

        {users ? (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
              Utilisateurs
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <TeamRolesBar byRole={users.byRole} />
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">Résumé équipe</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Indicateurs clés des comptes enregistrés
                </p>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
                    <dt className="text-xs font-medium text-teal-800">Clients actifs</dt>
                    <dd className="mt-1 text-2xl font-bold text-teal-900">
                      {users.activeClients}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                    <dt className="text-xs font-medium text-violet-800">Techniciens</dt>
                    <dd className="mt-1 text-2xl font-bold text-violet-900">
                      {users.byRole?.technicien ?? 0}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                    <dt className="text-xs font-medium text-orange-800">Coursiers</dt>
                    <dd className="mt-1 text-2xl font-bold text-orange-900">
                      {users.byRole?.coursier ?? 0}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <dt className="text-xs font-medium text-slate-700">Total comptes</dt>
                    <dd className="mt-1 text-2xl font-bold text-slate-900">{users.total}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        ) : null}

        {catalogue && Object.keys(catalogue).length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
              Catalogue & référentiels
            </h2>
            <CatalogueCompareChart catalogue={catalogue} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
