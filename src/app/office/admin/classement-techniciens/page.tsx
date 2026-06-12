'use client';

import Link from 'next/link';
import { Medal, Star } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api/client';
import { getNetworkErrorMessage } from '@/lib/api-errors';
import { ROLE_LABELS } from '@/lib/types/auth';

type TechnicianRanking = {
  rank: number | null;
  technicianId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  zone?: { id: string; name?: string | null; code?: string | null } | null;
  reviewCount: number;
  averageRating: number | null;
  minRating: number | null;
  maxRating: number | null;
  ratingDistribution: Record<string, number>;
};

type RankingsResponse = {
  generatedAt: string;
  summary: {
    techniciansActive: number;
    techniciansRated: number;
    totalReviews: number;
    globalAverageRating: number | null;
  };
  rankings: TechnicianRanking[];
};

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(value)
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-200'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold tabular-nums text-slate-800">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number | null }) {
  if (rank === null) {
    return <span className="text-sm text-slate-400">—</span>;
  }
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
        <Medal className="h-3.5 w-3.5" /> #{rank}
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
        <Medal className="h-3.5 w-3.5" /> #{rank}
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-900">
        <Medal className="h-3.5 w-3.5" /> #{rank}
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
      #{rank}
    </span>
  );
}

function DistributionBar({
  distribution,
  total,
}: {
  distribution: Record<string, number>;
  total: number;
}) {
  if (total === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  return (
    <div className="flex h-2 min-w-[120px] overflow-hidden rounded-full bg-slate-100">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[String(star)] ?? 0;
        const width = (count / total) * 100;
        const colors: Record<number, string> = {
          5: 'bg-emerald-500',
          4: 'bg-lime-500',
          3: 'bg-amber-400',
          2: 'bg-orange-400',
          1: 'bg-red-400',
        };
        if (width <= 0) return null;
        return (
          <div
            key={star}
            className={colors[star]}
            style={{ width: `${width}%` }}
            title={`${star} étoile${star > 1 ? 's' : ''} : ${count}`}
          />
        );
      })}
    </div>
  );
}

export default function ClassementTechniciensPage() {
  const { token } = useAuth();
  const [data, setData] = useState<RankingsResponse | null | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setData(undefined);
    try {
      const res = await apiFetch('/statistiques/techniciens/classement', {
        method: 'GET',
        token,
      });
      if (!res.ok) {
        setError('Impossible de charger le classement.');
        setData(null);
        return;
      }
      setData((await res.json()) as RankingsResponse);
    } catch (err) {
      setError(getNetworkErrorMessage(err));
      setData(null);
    }
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const rated = data?.rankings.filter((r) => r.reviewCount > 0) ?? [];

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <AdminPageHeader
          title="Classement des techniciens"
          subtitle="Classement par note moyenne des avis clients (prestations terminées)."
        />
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-12 lg:px-8">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Actualiser
          </button>
        </div>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {data === undefined ? (
          <p className="text-sm text-slate-500">Chargement du classement…</p>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-l-4 border-l-teal-500 shadow-sm">
                <CardHeader className="!py-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Agents actifs
                  </CardTitle>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {data.summary.techniciansActive}
                  </p>
                </CardHeader>
              </Card>
              <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardHeader className="!py-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Avis clients
                  </CardTitle>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {data.summary.totalReviews}
                  </p>
                </CardHeader>
              </Card>
              <Card className="border-l-4 border-l-indigo-500 shadow-sm">
                <CardHeader className="!py-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Techniciens notés
                  </CardTitle>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {data.summary.techniciansRated}
                  </p>
                </CardHeader>
              </Card>
              <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                <CardHeader className="!py-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Moyenne globale
                  </CardTitle>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {data.summary.globalAverageRating != null
                      ? `${data.summary.globalAverageRating.toFixed(1)} / 5`
                      : '—'}
                  </p>
                </CardHeader>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/80">
                <CardTitle className="text-base font-bold text-slate-900">
                  Palmarès
                  {rated.length > 0 ? (
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({rated.length} agent{rated.length > 1 ? 's' : ''} avec avis)
                    </span>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="!p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Rang
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Agent
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Zone
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Note moyenne
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Avis
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Répartition
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Min / Max
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                      {data.rankings.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-12 text-center text-sm text-slate-500"
                          >
                            Aucun technicien ou coursier actif.
                          </td>
                        </tr>
                      ) : (
                        data.rankings.map((row) => (
                          <tr
                            key={row.technicianId}
                            className={
                              row.rank != null && row.rank <= 3
                                ? 'bg-amber-50/30'
                                : undefined
                            }
                          >
                            <td className="px-4 py-3">
                              <RankBadge rank={row.rank} />
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">
                                {row.firstName} {row.lastName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {ROLE_LABELS[row.role] ?? row.role}
                                {row.email ? ` · ${row.email}` : ''}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              {row.zone?.name ?? '—'}
                            </td>
                            <td className="px-4 py-3">
                              {row.averageRating != null ? (
                                <StarDisplay value={row.averageRating} />
                              ) : (
                                <span className="text-sm text-slate-400">
                                  Aucun avis
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium tabular-nums text-slate-800">
                              {row.reviewCount}
                            </td>
                            <td className="px-4 py-3">
                              <DistributionBar
                                distribution={row.ratingDistribution}
                                total={row.reviewCount}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm tabular-nums text-slate-600">
                              {row.reviewCount > 0
                                ? `${row.minRating} – ${row.maxRating}`
                                : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {data.generatedAt ? (
              <p className="text-xs text-slate-400">
                Données au{' '}
                {new Date(data.generatedAt).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                . Les avis sont déposés par les clients après remise du résultat.{' '}
                <Link
                  href="/office/statistiques"
                  className="font-medium text-teal-700 hover:underline"
                >
                  Voir les indicateurs
                </Link>
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
