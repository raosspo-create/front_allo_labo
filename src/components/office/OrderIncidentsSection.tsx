'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api/client';
import { apiErrorMessage } from '@/lib/api-errors';
import { formatDateTimeFr } from '@/lib/calendar-utils';

export type OrderIncident = {
  id: string;
  category: string;
  categoryLabel: string;
  description: string;
  status: string;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
  reporter?: { firstName?: string; lastName?: string };
  resolvedBy?: { firstName?: string; lastName?: string } | null;
};

const INCIDENT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'client_absent', label: 'Client absent' },
  { value: 'access_issue', label: "Problème d'accès" },
  { value: 'sample_issue', label: 'Problème de prélèvement' },
  { value: 'equipment_failure', label: 'Matériel défaillant' },
  { value: 'safety', label: 'Sécurité' },
  { value: 'other', label: 'Autre' },
];

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  acknowledged: 'Pris en compte',
  resolved: 'Résolu',
  dismissed: 'Classé sans suite',
};

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-amber-100 text-amber-900',
  acknowledged: 'bg-sky-100 text-sky-900',
  resolved: 'bg-emerald-100 text-emerald-900',
  dismissed: 'bg-slate-100 text-slate-700',
};

type OrderIncidentsSectionProps = {
  orderId: string;
  token: string;
  orderStatus: string;
  canReport: boolean;
  isAdmin: boolean;
};

export function OrderIncidentsSection({
  orderId,
  token,
  orderStatus,
  canReport,
  isAdmin,
}: OrderIncidentsSectionProps) {
  const [incidents, setIncidents] = useState<OrderIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const reportFormRef = useRef<HTMLDetailsElement>(null);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/orders/${encodeURIComponent(orderId)}/incidents`,
        { method: 'GET', token },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(apiErrorMessage(data, 'Impossible de charger les incidents'));
        setIncidents([]);
        return;
      }
      const data = (await res.json()) as OrderIncident[];
      setIncidents(Array.isArray(data) ? data : []);
    } catch {
      setError('Erreur réseau lors du chargement des incidents.');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  async function submitIncident() {
    if (description.trim().length < 10) {
      setError('Décrivez l’incident en au moins 10 caractères.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/orders/${encodeURIComponent(orderId)}/incidents`,
        {
          method: 'POST',
          token,
          json: { category, description: description.trim() },
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(apiErrorMessage(data, 'Impossible d’enregistrer l’incident'));
        return;
      }
      setDescription('');
      setCategory('other');
      reportFormRef.current?.removeAttribute('open');
      await loadIncidents();
    } catch {
      setError('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  }

  async function resolveIncident(
    incidentId: string,
    status: string,
    resolutionNote?: string,
  ) {
    setResolvingId(incidentId);
    setError(null);
    try {
      const res = await apiFetch(
        `/orders/${encodeURIComponent(orderId)}/incidents/${encodeURIComponent(incidentId)}`,
        {
          method: 'PATCH',
          token,
          json: {
            status,
            ...(resolutionNote?.trim()
              ? { resolutionNote: resolutionNote.trim() }
              : {}),
          },
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(apiErrorMessage(data, 'Impossible de mettre à jour l’incident'));
        return;
      }
      await loadIncidents();
    } catch {
      setError('Erreur réseau.');
    } finally {
      setResolvingId(null);
    }
  }

  const reportable =
    canReport &&
    ['prise_en_compte', 'programme', 'arrivee_patient', 'remise_centre'].includes(
      orderStatus,
    );

  return (
    <Card className="mb-4 border-amber-200/80 shadow-sm">
      <CardHeader className="bg-amber-50/60 py-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Rapport de prestation — incidents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {reportable ? (
          <details
            ref={reportFormRef}
            className="group rounded-xl border border-amber-100 bg-amber-50/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                Signaler un incident
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-3 border-t border-amber-100 px-4 pb-4 pt-3">
              <p className="text-sm text-slate-700">
                Problème sur le terrain (client absent, accès, prélèvement…).
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Type d’incident
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={submitting}
                  >
                    {INCIDENT_CATEGORIES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Description
                </label>
                <textarea
                  className="min-h-[88px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez la situation rencontrée…"
                  disabled={submitting}
                  maxLength={2000}
                />
              </div>
              <Button
                type="button"
                onClick={() => void submitIncident()}
                disabled={submitting}
              >
                {submitting ? 'Envoi…' : 'Envoyer le signalement'}
              </Button>
            </div>
          </details>
        ) : canReport ? (
          <p className="text-sm text-slate-600">
            Le signalement est disponible après prise en compte de la commande (jusqu’à la remise au centre).
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">Chargement des incidents…</p>
        ) : incidents.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun incident signalé pour cette commande.</p>
        ) : (
          <ul className="space-y-3">
            {incidents.map((incident) => (
              <li
                key={incident.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{incident.categoryLabel}</p>
                    <p className="mt-1 text-sm text-slate-700">{incident.description}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[incident.status] ?? STATUS_BADGE.open}`}
                  >
                    {incident.status === 'resolved' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Signalé le {formatDateTimeFr(incident.createdAt)}
                  {incident.reporter
                    ? ` . par ${incident.reporter.firstName ?? ''} ${incident.reporter.lastName ?? ''}`.trim()
                    : ''}
                </p>
                {incident.resolutionNote ? (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="font-medium">Traitement : </span>
                    {incident.resolutionNote}
                  </p>
                ) : null}

                {isAdmin &&
                incident.status !== 'resolved' &&
                incident.status !== 'dismissed' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {incident.status === 'open' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="!px-3 !py-1.5 text-xs"
                        disabled={resolvingId === incident.id}
                        onClick={() =>
                          void resolveIncident(incident.id, 'acknowledged')
                        }
                      >
                        Prendre en compte
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      className="!px-3 !py-1.5 text-xs"
                      disabled={resolvingId === incident.id}
                      onClick={() =>
                        void resolveIncident(
                          incident.id,
                          'resolved',
                          'Incident traité.',
                        )
                      }
                    >
                      Marquer résolu
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="!px-3 !py-1.5 text-xs"
                      disabled={resolvingId === incident.id}
                      onClick={() =>
                        void resolveIncident(
                          incident.id,
                          'dismissed',
                          'Classé sans suite.',
                        )
                      }
                    >
                      Classer sans suite
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
