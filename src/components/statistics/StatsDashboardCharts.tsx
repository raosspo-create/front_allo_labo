'use client';

import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDuration } from '@/lib/analytics/format';
import {
  DEVICE_COLORS,
  DEVICE_LABELS,
  ORDER_PIPELINE,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ROLE_COLORS,
  ROLE_LABELS,
} from '@/lib/statistics-labels';

type OrderStats = {
  total: number;
  createdLastDays30: number;
  byStatus: Record<string, number>;
  revenue?: {
    sumAmountExcludingCancelled: string | null;
    currencyApproximation?: string;
    cancelledOrderCount?: number;
  };
};

type UserStats = {
  total: number;
  activeClients: number;
  byRole: Record<string, number>;
};

type CatalogueStats = {
  centres?: number;
  centresCount?: number;
  zonesActive?: number;
  zonesCount?: number;
  zonesTotal?: number;
  servicesActive?: number;
  servicesCount?: number;
  servicesTotal?: number;
  analysesActive?: number;
  analysesCount?: number;
  analysesTotal?: number;
  supplementFeesActive?: number;
  fraisCount?: number;
  supplementFeesTotal?: number;
  zoneTariffs?: number;
};

type UsageStats = {
  ordersWithAnalysisLinesCount?: number;
  ordersWithSupplementLinesCount?: number;
  avgAnalysisLinesPerOrder?: number | null;
  averageAnalysesPerOrderAmongOrdersWithLines?: number | null;
  averageSupplementsPerOrderAmongOrdersWithSupplements?: number | null;
};

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-500">
      {message}
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label ? <p className="mb-1 font-semibold text-slate-800">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} className="text-slate-600">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color ?? '#0d9488' }}
          />
          {entry.name} : <span className="font-bold text-slate-900">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function KpiHero({
  orders,
  users,
  revenue,
}: {
  orders: OrderStats;
  users?: UserStats;
  revenue: string | null;
}) {
  const inProgress =
    (orders.byStatus?.en_attente ?? 0) +
    (orders.byStatus?.prise_en_compte ?? 0) +
    (orders.byStatus?.programme ?? 0) +
    (orders.byStatus?.arrivee_patient ?? 0) +
    (orders.byStatus?.remise_centre ?? 0);
  const successRate =
    orders.total > 0
      ? Math.round(((orders.byStatus?.resultat_rendu ?? 0) / orders.total) * 100)
      : 0;

  const kpis = [
    {
      label: 'Commandes totales',
      value: orders.total,
      hint: `${orders.createdLastDays30} sur 30 j`,
      accent: 'from-teal-500 to-teal-600',
    },
    {
      label: 'Chiffre d’affaires',
      value: revenue ?? '—',
      hint: 'Hors annulées',
      accent: 'from-emerald-500 to-teal-600',
      isText: true,
    },
    {
      label: 'En cours de traitement',
      value: inProgress,
      hint: 'Pipeline actif',
      accent: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Taux de réussite',
      value: `${successRate}%`,
      hint: `${orders.byStatus?.resultat_rendu ?? 0} résultats rendus`,
      accent: 'from-violet-500 to-purple-600',
      isText: true,
    },
    {
      label: 'Clients actifs',
      value: users?.activeClients ?? 0,
      hint: `${users?.total ?? 0} comptes au total`,
      accent: 'from-cyan-500 to-teal-500',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
        >
          <div
            className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${kpi.accent}`}
          />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {kpi.label}
          </p>
          <p
            className={`mt-2 font-bold tabular-nums text-slate-900 ${
              kpi.isText ? 'text-xl sm:text-2xl' : 'text-3xl'
            }`}
          >
            {kpi.value}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{kpi.hint}</p>
        </div>
      ))}
    </div>
  );
}

export function OrderStatusDonut({ byStatus, total }: { byStatus: Record<string, number>; total: number }) {
  const data = Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: ORDER_STATUS_LABELS[status] ?? status,
      value: count,
      key: status,
    }));

  if (data.length === 0) {
    return (
      <ChartCard title="Répartition des statuts" subtitle="Part de chaque état dans le parcours commande">
        <EmptyChart message="Aucune commande enregistrée" />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Répartition des statuts" subtitle="Diagramme en anneau — part de chaque état">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={ORDER_STATUS_COLORS[entry.key] ?? '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={48}
              formatter={(value) => (
                <span className="text-xs text-slate-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">
        {total} commande{total > 1 ? 's' : ''} au total
      </p>
    </ChartCard>
  );
}

export function OrderPipelineBar({ byStatus }: { byStatus: Record<string, number> }) {
  const data = ORDER_PIPELINE.map((status) => ({
    name: ORDER_STATUS_LABELS[status],
    count: byStatus[status] ?? 0,
    key: status,
  }));

  const hasData = data.some((d) => d.count > 0);

  return (
    <ChartCard
      title="Pipeline des commandes"
      subtitle="Histogramme horizontal — volume par étape du parcours"
    >
      {hasData ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={108}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Commandes" radius={[0, 6, 6, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={ORDER_STATUS_COLORS[entry.key] ?? '#0d9488'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart message="Aucune donnée de pipeline" />
      )}
    </ChartCard>
  );
}

export function OrderActivityBar({
  total,
  last30,
}: {
  total: number;
  last30: number;
}) {
  const before = Math.max(0, total - last30);
  const data = [
    { name: '30 derniers jours', value: last30, fill: '#0d9488' },
    { name: 'Période antérieure', value: before, fill: '#94a3b8' },
  ];

  return (
    <ChartCard
      title="Activité récente"
      subtitle="Comparaison des créations de commandes"
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Commandes" radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {total > 0 ? (
        <p className="mt-2 text-center text-xs font-medium text-teal-700">
          {Math.round((last30 / total) * 100)}% des commandes créées ce mois-ci
        </p>
      ) : null}
    </ChartCard>
  );
}

export function TeamRolesBar({ byRole }: { byRole: Record<string, number> }) {
  const data = Object.entries(byRole).map(([role, count]) => ({
    name: ROLE_LABELS[role] ?? role,
    count,
    key: role,
  }));

  return (
    <ChartCard title="Équipe & utilisateurs" subtitle="Répartition par rôle">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Comptes" radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={ROLE_COLORS[entry.key] ?? '#64748b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function CatalogueCompareChart({ catalogue }: { catalogue: CatalogueStats }) {
  const data = [
    {
      name: 'Services',
      actifs: catalogue.servicesActive ?? catalogue.servicesCount ?? 0,
      total: catalogue.servicesTotal ?? catalogue.servicesCount ?? 0,
    },
    {
      name: 'Analyses',
      actifs: catalogue.analysesActive ?? catalogue.analysesCount ?? 0,
      total: catalogue.analysesTotal ?? catalogue.analysesCount ?? 0,
    },
    {
      name: 'Zones',
      actifs: catalogue.zonesActive ?? catalogue.zonesCount ?? 0,
      total: catalogue.zonesTotal ?? catalogue.zonesCount ?? 0,
    },
    {
      name: 'Frais supp.',
      actifs: catalogue.supplementFeesActive ?? catalogue.fraisCount ?? 0,
      total: catalogue.supplementFeesTotal ?? catalogue.fraisCount ?? 0,
    },
  ];

  return (
    <ChartCard
      title="Référentiels catalogue"
      subtitle="Barres groupées — entrées actives vs total en base"
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
            <Bar dataKey="actifs" name="Actifs" fill="#0d9488" radius={[6, 6, 0, 0]} />
            <Bar dataKey="total" name="Total" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
        <span>
          <span className="font-semibold text-slate-800">
            {catalogue.centres ?? catalogue.centresCount ?? 0}
          </span>{' '}
          centres
        </span>
        {catalogue.zoneTariffs != null ? (
          <span>
            <span className="font-semibold text-slate-800">{catalogue.zoneTariffs}</span> tarifs
            zone
          </span>
        ) : null}
      </div>
    </ChartCard>
  );
}

export function UsageCompositionChart({
  usage,
  ordersTotal,
}: {
  usage: UsageStats;
  ordersTotal: number;
}) {
  const withAnalyses =
    usage.ordersWithAnalysisLinesCount ?? 0;
  const withSupplements =
    usage.ordersWithSupplementLinesCount ?? 0;
  const withBoth = Math.min(withAnalyses, withSupplements);
  const onlyAnalyses = Math.max(0, withAnalyses - withBoth);
  const onlySupplements = Math.max(0, withSupplements - withBoth);
  const plain = Math.max(0, ordersTotal - withAnalyses - withSupplements + withBoth);

  const data = [
    { name: 'Avec analyses', value: onlyAnalyses + withBoth, fill: '#8b5cf6' },
    { name: 'Frais supp. seuls', value: onlySupplements, fill: '#f59e0b' },
    { name: 'Sans ligne extra', value: plain, fill: '#e2e8f0' },
  ].filter((d) => d.value > 0);

  const avgAnalyses =
    usage.avgAnalysisLinesPerOrder ??
    usage.averageAnalysesPerOrderAmongOrdersWithLines;
  const avgSupplements = usage.averageSupplementsPerOrderAmongOrdersWithSupplements;

  return (
    <ChartCard
      title="Composition des commandes"
      subtitle="Camembert — analyses, frais et commandes simples"
    >
      {data.length > 0 ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={82}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart message="Pas encore de commandes composées" />
      )}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-violet-50 px-3 py-2 text-violet-900">
          <span className="font-semibold">Moy. analyses</span>
          <p className="text-lg font-bold tabular-nums">
            {avgAnalyses != null ? avgAnalyses.toFixed(1) : '—'}
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
          <span className="font-semibold">Moy. frais supp.</span>
          <p className="text-lg font-bold tabular-nums">
            {avgSupplements != null ? avgSupplements.toFixed(1) : '—'}
          </p>
        </div>
      </div>
    </ChartCard>
  );
}

export type WebTrafficStats = {
  totalPageViews?: number;
  pageViewsLast30Days?: number;
  uniqueVisitors?: number;
  uniqueVisitorsLast30Days?: number;
  byDevice?: Record<string, number>;
  timeOnSite?: {
    measuredPageViews?: number;
    averageDurationSec?: number | null;
    totalDurationSec?: number;
  };
  topPaths?: { path: string; views: number }[];
};

export function WebTrafficKpi({ traffic }: { traffic: WebTrafficStats }) {
  const avg = traffic.timeOnSite?.averageDurationSec ?? null;
  const totalTime = traffic.timeOnSite?.totalDurationSec ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
          Pages vues
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-sky-950">
          {traffic.totalPageViews ?? 0}
        </p>
        <p className="mt-1 text-xs text-sky-800/80">
          {traffic.pageViewsLast30Days ?? 0} sur 30 jours
        </p>
      </div>
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Visiteurs uniques
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-indigo-950">
          {traffic.uniqueVisitors ?? 0}
        </p>
        <p className="mt-1 text-xs text-indigo-800/80">
          {traffic.uniqueVisitorsLast30Days ?? 0} sur 30 jours
        </p>
      </div>
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Temps moyen / page
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-950">
          {formatDuration(avg)}
        </p>
        <p className="mt-1 text-xs text-emerald-800/80">
          {traffic.timeOnSite?.measuredPageViews ?? 0} pages mesurées
        </p>
      </div>
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Temps total sur le site
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-amber-950">
          {formatDuration(totalTime)}
        </p>
        <p className="mt-1 text-xs text-amber-800/80">Somme des durées enregistrées</p>
      </div>
    </div>
  );
}

export function WebDeviceDonut({ byDevice }: { byDevice: Record<string, number> }) {
  const data = Object.entries(byDevice)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: DEVICE_LABELS[key] ?? key,
      value,
      fill: DEVICE_COLORS[key] ?? '#94a3b8',
    }));
  const total = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <ChartCard
      title="Périphériques"
      subtitle="Répartition des pages vues par type d'appareil"
    >
      {total > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart message="Aucune visite enregistrée pour le moment" />
      )}
    </ChartCard>
  );
}

export function WebTopPagesBar({
  topPaths,
}: {
  topPaths: { path: string; views: number }[];
}) {
  const data = topPaths.map((row) => ({
    path: row.path.length > 28 ? `${row.path.slice(0, 28)}…` : row.path,
    fullPath: row.path,
    views: row.views,
  }));

  return (
    <ChartCard
      title="Pages les plus consultées"
      subtitle="Classement par nombre de vues"
    >
      {data.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="path" width={120} tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const row = payload[0].payload as { fullPath: string; views: number };
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                      <p className="font-semibold text-slate-900">{row.fullPath}</p>
                      <p className="mt-1 text-slate-600">{row.views} vues</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="views" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart message="Aucune page consultée" />
      )}
    </ChartCard>
  );
}
