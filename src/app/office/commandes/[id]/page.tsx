'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/app/providers';
import { buttonClassName, Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BilanAttachmentPreviewCard } from '@/components/office/BilanAttachmentPreviewCard';
import { apiFetch } from '@/lib/api/client';
import { parsePaginatedResponse } from '@/lib/pagination';
import { apiErrorMessage, getNetworkErrorMessage } from '@/lib/api-errors';
import { serviceNameIndicatesBilan } from '@/lib/bilan-service';
import { publicApiUrl } from '@/lib/env';
import {
  canFieldAgentChangeStatus,
  canInteractWithOrderStatus,
  hasOrderGestionAccess,
  isFieldAgentRole,
  resolveOrderPermissionsForRole,
} from '@/lib/order-permissions';
import { isStaffAdmin } from '@/lib/types/auth';
import { useToastFeedback } from '@/hooks/useToastFeedback';
import { ClientLocationDisplay } from '@/components/office/ClientLocationDisplay';
import {
  datetimeLocalToIso,
  formatDateTimeFr,
  toDatetimeLocalValue,
} from '@/lib/calendar-utils';
import { AppointmentSlotPicker } from '@/components/office/AppointmentSlotPicker';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
} from '@/lib/order-status';
import { OrderIncidentsSection } from '@/components/office/OrderIncidentsSection';
import { OrderReviewSection } from '@/components/office/OrderReviewSection';

type OrderDetail = {
  id: string;
  codeSuivi?: string | null;
  status: string;
  paid?: boolean;
  amount?: string | null;
  serviceName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  scheduledAt?: string | null;
  technicianId?: string | null;
  centreId?: string | null;
  zoneId?: string | null;
  clientAddress?: string | null;
  clientLatitude?: number | null;
  clientLongitude?: number | null;
  fromZoneId?: string | null;
  serviceId?: string | null;
  partnerCommission?: string | null;
  partnerCommissionType?: 'percentage' | 'fixed' | null;
  client?: { firstName?: string; lastName?: string; email?: string } | null;
  technician?: { id: string; firstName?: string; lastName?: string; phone?: string | null; role?: string } | null;
  centre?: { id: string; siteName?: string | null } | null;
  orderCentres?: {
    centre?: {
      id: string;
      siteName?: string | null;
      zone?: { id: string; name?: string | null; code?: string | null } | null;
    } | null;
  }[];
  zone?: { id: string; name?: string | null; code?: string | null } | null;
  fromZone?: { id: string; name?: string | null; code?: string | null } | null;
  service?: { id: string; name?: string | null; price?: string | null } | null;
  orderAnalyses?: {
    id: string;
    analyseId?: string;
    amountSnapshot?: string | null;
    centre?: {
      id: string;
      siteName?: string | null;
      zone?: { id: string; name?: string | null; code?: string | null } | null;
    } | null;
    analyse?: { id?: string; name?: string | null; code?: string | null } | null;
  }[];
  orderFrais?: { frais?: { id: string; name?: string | null }; amountSnapshot?: string | null }[];
  bilanAttachment?: { id?: string; originalName: string; mimeType: string } | null;
  bilanAttachments?: { id: string; originalName: string; mimeType: string; position?: number }[];
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type Centre = {
  id: string;
  siteName: string;
  address?: string | null;
};

type FraisSupplementaire = {
  id: string;
  code?: string | null;
  name: string;
  amount: string;
};

type CentreAnalyseTariffRow = {
  analyseId: string;
  price: string;
  currency?: string;
};

type AnalyseLine = NonNullable<OrderDetail['orderAnalyses']>[number];

function resolveAnalyseId(line: AnalyseLine): string | undefined {
  return line.analyseId ?? line.analyse?.id;
}

function resolveAnalyseLinePrice(
  line: AnalyseLine,
  centreId: string | undefined,
  tariffsByCentreId: Record<string, CentreAnalyseTariffRow[]>,
  tariffsLoaded: Set<string>,
): { price: string | null; missing: boolean; loading: boolean } {
  if (!centreId) {
    return { price: null, missing: false, loading: false };
  }

  const analyseId = resolveAnalyseId(line);
  if (!analyseId) {
    return { price: line.amountSnapshot ?? null, missing: false, loading: false };
  }

  if (!tariffsLoaded.has(centreId)) {
    return { price: null, missing: false, loading: true };
  }

  const tariff = tariffsByCentreId[centreId]?.find((t) => t.analyseId === analyseId);
  if (tariff) {
    return { price: tariff.price, missing: false, loading: false };
  }

  return { price: null, missing: true, loading: false };
}

function formatXof(amount: string | number | null | undefined): string | null {
  if (amount === null || amount === undefined || amount === '') {
    return null;
  }
  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return null;
  }
  return `${n.toLocaleString('fr-FR')} XOF`;
}

const statusLabels: Record<string, { label: string; color: string }> =
  Object.fromEntries(
    [...ORDER_STATUS_FLOW, 'annule'].map((key) => [
      key,
      {
        label: ORDER_STATUS_LABELS[key] ?? key,
        color: ORDER_STATUS_COLORS[key] ?? 'bg-slate-100 text-slate-700 border-slate-200',
      },
    ]),
  );

function flowStepIndex(status: string): number {
  const i = ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);
  return i >= 0 ? i : 0;
}

type OrderStatusStepperProps = {
  status: string;
  interactive: boolean;
  disabled?: boolean;
  onSelectStatus?: (next: string) => void;
  canSelectStatus?: (next: string) => boolean;
};

function OrderStatusStepper({
  status,
  interactive,
  disabled,
  onSelectStatus,
  canSelectStatus,
}: OrderStatusStepperProps) {
  const cancelled = status === 'annule';
  const currentIdx = cancelled ? -1 : flowStepIndex(status);

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Statut de la commande
        </p>
        {cancelled ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusLabels.annule.color}`}
          >
            {statusLabels.annule.label}
          </span>
        ) : null}
      </div>

      <div
        className={`overflow-x-auto pb-1 ${cancelled ? 'pointer-events-none opacity-55' : ''}`}
        aria-label="Progression du dossier"
      >
        <div className="mx-auto max-w-1xl">
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-6 sm:gap-2">
            {ORDER_STATUS_FLOW.map((value, i) => {
              const done = !cancelled && currentIdx > i;
              const current = !cancelled && currentIdx === i;

              const circle =
                done
                  ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                  : current
                    ? 'border-teal-600 bg-white text-teal-700 shadow-md ring-2 ring-teal-200 ring-offset-2 ring-offset-white'
                    : 'border-slate-200 bg-slate-50 text-slate-400';

              const canClick =
                interactive &&
                !disabled &&
                !cancelled &&
                value !== status &&
                onSelectStatus &&
                (canSelectStatus ? canSelectStatus(value) : true);

              return (
                <div key={value} className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    title={statusLabels[value]?.label ?? value}
                    disabled={!canClick}
                    onClick={() => canClick && onSelectStatus(value)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition ${circle} ${
                      canClick
                        ? 'cursor-pointer hover:border-teal-500 hover:shadow-md'
                        : 'cursor-default'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {done ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </button>
                  <span
                    className={`text-center text-[10px] font-semibold leading-tight sm:text-xs ${
                      current ? 'text-teal-900' : done ? 'text-teal-800' : 'text-slate-400'
                    }`}
                  >
                    {statusLabels[value]?.label ?? value}
                  </span>
                </div>
              );
            })}
          </div>
          {!cancelled ? (
            <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-teal-500 transition-all duration-300"
                style={{
                  width: `${((currentIdx + 1) / ORDER_STATUS_FLOW.length) * 100}%`,
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {interactive && !cancelled ? (
        <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
          Cliquez sur une étape pour changer le statut (une confirmation sera demandée).
        </p>
      ) : !interactive && !cancelled ? (
        <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
          Le laboratoire met à jour cette progression ; le paiement en ligne s’ouvre après prise en compte.
        </p>
      ) : null}
    </div>
  );
}

const gestionSelectClass =
  'w-full appearance-none rounded-lg border-2 border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-900 shadow-sm transition hover:border-teal-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

function GestionAssignmentCard({
  title,
  hint,
  icon,
  children,
}: {
  title: string;
  hint?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          {hint ? <p className="mt-1 text-xs leading-relaxed text-slate-600">{hint}</p> : null}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export default function CommandeDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { token, user } = useAuth();
  const isClient = user?.role === 'client';
  const isAdmin = isStaffAdmin(user?.role);
  const isFieldAgent = isFieldAgentRole(user?.role);
  const orderPerms = resolveOrderPermissionsForRole(
    user?.role,
    user?.orderPermissions,
  );
  const canManageAnalyseCentres = isAdmin || orderPerms.manageCentres;
  const canAssignAgent = isAdmin || orderPerms.assignAgent;
  const canManageCommission = isAdmin || orderPerms.manageCommission;
  const canManageFrais = isAdmin || orderPerms.manageFrais;
  const canValidateOrder = isAdmin || orderPerms.validateOrder;
  const canChangeOrderStatus = isAdmin || canInteractWithOrderStatus(orderPerms);
  const canCancelOrder = isAdmin || orderPerms.cancelOrder;
  const showGestionPanel = isAdmin || hasOrderGestionAccess(orderPerms);
  const [order, setOrder] = useState<OrderDetail | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [paiementRetour, setPaiementRetour] = useState(false);
  const [bilanDownloadingId, setBilanDownloadingId] = useState<string | null>(null);
  const [bilanDownloadError, setBilanDownloadError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [fedapayBusy, setFedapayBusy] = useState(false);
  const [fedapayError, setFedapayError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  const [technicians, setTechnicians] = useState<User[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [availableFrais, setAvailableFrais] = useState<FraisSupplementaire[]>([]);
  const [selectedFraisIds, setSelectedFraisIds] = useState<Set<string>>(new Set());
  const [analyseCentreByLineId, setAnalyseCentreByLineId] = useState<
    Record<string, string>
  >({});
  const [defaultAnalyseCentreId, setDefaultAnalyseCentreId] = useState('');
  const [tariffsByCentreId, setTariffsByCentreId] = useState<
    Record<string, CentreAnalyseTariffRow[]>
  >({});
  const [tariffsLoadedCentreIds, setTariffsLoadedCentreIds] = useState<
    Set<string>
  >(new Set());
  const [localCommission, setLocalCommission] = useState<string>('');
  const [localCommissionType, setLocalCommissionType] = useState<'percentage' | 'fixed'>('fixed');
  const [localScheduledAt, setLocalScheduledAt] = useState('');
  const [validateScheduledAt, setValidateScheduledAt] = useState('');
  const [isGestionExpanded, setIsGestionExpanded] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id || !token) {
      return;
    }
    setError(null);
    try {
      const res = await apiFetch(`/orders/${encodeURIComponent(id)}`, {
        method: 'GET',
        token,
      });
      if (res.status === 404 || res.status === 403) {
        setError('Commande introuvable ou non autorisée.');
        setOrder(null);
        return;
      }
      if (!res.ok) {
        setError('Impossible de charger la commande.');
        setOrder(null);
        return;
      }
      const data = (await res.json()) as OrderDetail;
      setOrder(data);

      if (data.orderFrais) {
        setSelectedFraisIds(
          new Set(data.orderFrais.map((f) => f.frais?.id).filter(Boolean) as string[]),
        );
      }

      const centreByLine: Record<string, string> = {};
      for (const line of data.orderAnalyses ?? []) {
        if (line.id && line.centre?.id) {
          centreByLine[line.id] = line.centre.id;
        }
      }
      setAnalyseCentreByLineId(centreByLine);

      const assignedCentreIds = [
        ...new Set(Object.values(centreByLine).filter(Boolean)),
      ];
      if (assignedCentreIds.length === 1) {
        setDefaultAnalyseCentreId(assignedCentreIds[0]);
      } else if (data.centreId) {
        setDefaultAnalyseCentreId(data.centreId);
      } else {
        setDefaultAnalyseCentreId('');
      }

      if (data.partnerCommission) {
        setLocalCommission(data.partnerCommission);
      }
      if (data.partnerCommissionType) {
        setLocalCommissionType(data.partnerCommissionType);
      }
      setLocalScheduledAt(toDatetimeLocalValue(data.scheduledAt));
    } catch (err) {
      setError(getNetworkErrorMessage(err));
      setOrder(null);
    }
  }, [id, token]);

  const syncFedapayAfterReturn = useCallback(async () => {
    if (!id || !token) {
      return;
    }
    try {
      const res = await apiFetch(
        `/orders/${encodeURIComponent(id)}/payments/fedapay/sync`,
        { method: 'POST', token },
      );
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as OrderDetail;
      setOrder(data);
    } catch {
      /* FedaPay ou réseau : loadOrder fera un second essai */
    }
  }, [id, token]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setPaiementRetour(
      new URLSearchParams(window.location.search).get('paiement') === 'retour',
    );
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(async () => {
      if (cancelled) return;
      await loadOrder();
    });
    return () => {
      cancelled = true;
    };
  }, [loadOrder]);

  const loadCentreTariffs = useCallback(async (centreId: string) => {
    if (!centreId) return;
    try {
      const res = await fetch(
        `${publicApiUrl()}/centre-analyse-tariffs?centreId=${encodeURIComponent(centreId)}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) {
        setTariffsByCentreId((prev) => ({ ...prev, [centreId]: [] }));
        return;
      }
      const data = (await res.json()) as CentreAnalyseTariffRow[];
      setTariffsByCentreId((prev) => ({
        ...prev,
        [centreId]: Array.isArray(data) ? data : [],
      }));
    } catch {
      setTariffsByCentreId((prev) => ({ ...prev, [centreId]: [] }));
    } finally {
      setTariffsLoadedCentreIds((prev) => {
        const next = new Set(prev);
        next.add(centreId);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const centreIds = new Set<string>();
    for (const line of order?.orderAnalyses ?? []) {
      const selected = analyseCentreByLineId[line.id] || line.centre?.id;
      if (selected) {
        centreIds.add(selected);
      }
    }
    for (const centreId of centreIds) {
      if (!tariffsLoadedCentreIds.has(centreId)) {
        void loadCentreTariffs(centreId);
      }
    }
  }, [order?.orderAnalyses, analyseCentreByLineId, tariffsLoadedCentreIds, loadCentreTariffs]);

  useEffect(() => {
    if (!paiementRetour || !id || !token) {
      return;
    }
    void syncFedapayAfterReturn();
    const t = window.setTimeout(() => {
      void syncFedapayAfterReturn();
      void loadOrder();
    }, 2500);
    return () => clearTimeout(t);
  }, [paiementRetour, id, token, loadOrder, syncFedapayAfterReturn]);

  useEffect(() => {
    if (!token) return;
    const loadTechList = isAdmin || canAssignAgent;
    let cancelled = false;

    queueMicrotask(async () => {
      const base = publicApiUrl();

      async function loadCentres() {
        try {
          const res = await fetch(`${base}/centres`, {
            headers: { Accept: 'application/json' },
          });
          if (cancelled || !res.ok) return;
          const centresData = (await res.json()) as Centre[];
          if (Array.isArray(centresData)) setCentres(centresData);
        } catch (err) {
          console.error('Impossible de charger les centres:', err);
        }
      }

      async function loadFrais() {
        try {
          const res = await fetch(`${base}/frais-supplementaires`, {
            headers: { Accept: 'application/json' },
          });
          if (cancelled || !res.ok) return;
          const fraisData = (await res.json()) as FraisSupplementaire[];
          if (Array.isArray(fraisData)) setAvailableFrais(fraisData);
        } catch (err) {
          console.error('Impossible de charger les frais supplémentaires:', err);
        }
      }

      async function loadTechnicians() {
        if (!loadTechList) return;
        try {
          const usersRes = await apiFetch(
            '/users?limit=500',
            { method: 'GET', token },
          );
          if (cancelled || !usersRes.ok) return;
          const users = await parsePaginatedResponse<User>(usersRes);
          setTechnicians(
            users.items.filter((u) => u.role === 'technicien' || u.role === 'coursier'),
          );
        } catch (err) {
          console.error('Impossible de charger les utilisateurs (techniciens):', err);
        }
      }

      await Promise.all([loadCentres(), loadFrais(), loadTechnicians()]);
    });

    return () => {
      cancelled = true;
    };
  }, [token, isAdmin, canAssignAgent]);

  useToastFeedback(updateError, updateSuccess);
  useToastFeedback(error);
  useToastFeedback(fedapayError);
  useToastFeedback(bilanDownloadError);

  function sumServiceAmount(): number {
    if (!order?.service) return 0;
    const p = order.service.price;
    const n =
      p != null && String(p).trim() !== '' ? parseFloat(String(p)) : 0;
    return Number.isNaN(n) ? 0 : n;
  }

  function sumAnalysesAmount(): number {
    return (order?.orderAnalyses ?? []).reduce((s, line) => {
      if (line.amountSnapshot == null) return s;
      const n = parseFloat(String(line.amountSnapshot));
      return s + (Number.isNaN(n) ? 0 : n);
    }, 0);
  }

  function sumPersistedFraisAmount(): number {
    return (order?.orderFrais ?? []).reduce((s, line) => {
      const n = parseFloat(String(line.amountSnapshot ?? 0));
      return s + (Number.isNaN(n) ? 0 : n);
    }, 0);
  }

  /** Service + frais catalogue cochés (aperçu avant enregistrement des frais). */
  function calculateServiceAndFraisSubtotal(): number {
    if (!order) return 0;

    let total = sumServiceAmount();

    if (order.orderFrais?.length) {
      total += sumPersistedFraisAmount();
    } else {
      for (const fraisId of selectedFraisIds) {
        const frais = availableFrais.find((f) => f.id === fraisId);
        if (frais) {
          total += parseFloat(frais.amount);
        }
      }
    }

    return total;
  }

  /** Montant client enregistré (inclut analyses + trajet). */
  function calculateClientPayableTotal(): number {
    if (!order) return 0;
    if (order.amount != null && String(order.amount).trim() !== '') {
      const stored = parseFloat(String(order.amount));
      if (!Number.isNaN(stored)) return stored;
    }
    return (
      sumServiceAmount() +
      sumAnalysesAmount() +
      (order.orderFrais?.length
        ? sumPersistedFraisAmount()
        : calculateServiceAndFraisSubtotal() - sumServiceAmount())
    );
  }

  function calculateRouteFeeAmount(): number {
    const payable = calculateClientPayableTotal();
    const known =
      sumServiceAmount() + sumAnalysesAmount() + sumPersistedFraisAmount();
    const route = payable - known;
    return route > 0.01 ? route : 0;
  }

  /** @deprecated Utiliser calculateServiceAndFraisSubtotal — conservé pour la commission. */
  function calculateTotal(): number {
    return calculateServiceAndFraisSubtotal();
  }

  function calculateCommission(): number {
    if (!localCommission || localCommission === '') return 0;
    const commissionValue = parseFloat(localCommission);
    if (isNaN(commissionValue)) return 0;
    
    if (localCommissionType === 'percentage') {
      const total = calculateTotal();
      return (total * commissionValue) / 100;
    }
    
    return commissionValue;
  }

  function calculateFinalTotal(): number {
    return calculateClientPayableTotal();
  }

  if (order === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-sm text-slate-500 lg:px-8">
        Chargement du dossier…
      </div>
    );
  }

  if (error || order === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 lg:px-8">
        <Card className="border-red-100 bg-red-50/80">
          <CardContent className="py-6 text-sm text-red-900">{error ?? 'Erreur'}</CardContent>
        </Card>
        <Link href="/office/commandes" className={`${buttonClassName('secondary')} mt-8 inline-flex`}>
          Retour liste
        </Link>
      </div>
    );
  }

  const analyses = order.orderAnalyses ?? [];
  const frais = order.orderFrais ?? [];
  const bilanAttachments =
    order.bilanAttachments?.length
      ? order.bilanAttachments
      : order.bilanAttachment
        ? [
            {
              id: order.bilanAttachment.id ?? 'legacy',
              originalName: order.bilanAttachment.originalName,
              mimeType: order.bilanAttachment.mimeType,
            },
          ]
        : [];
  const showBilanDocumentSection =
    bilanAttachments.length > 0 &&
    (serviceNameIndicatesBilan(order.service?.name) ||
      serviceNameIndicatesBilan(order.serviceName));

  async function handleDownloadBilan(attachmentId: string, fileName: string) {
    if (!token || !id) return;
    setBilanDownloadingId(attachmentId);
    setBilanDownloadError(null);
    try {
      const path =
        attachmentId === 'legacy'
          ? `/orders/${encodeURIComponent(id)}/bilan-fichier`
          : `/orders/${encodeURIComponent(id)}/bilan-fichier/${encodeURIComponent(attachmentId)}`;
      const res = await apiFetch(path, {
        method: 'GET',
        token,
      });
      if (!res.ok) {
        setBilanDownloadError('Téléchargement impossible.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setBilanDownloadError(getNetworkErrorMessage(err));
    } finally {
      setBilanDownloadingId(null);
    }
  }

  function requestUpdateOrder(updates: { status: string }) {
    let title = '';
    let message = '';
    let variant: 'danger' | 'warning' | 'info' = 'info';
    
    const newStatusLabel = statusLabels[updates.status]?.label || updates.status;
    title = 'Changer le statut';
    message = `Voulez-vous vraiment changer le statut de cette commande en « ${newStatusLabel} » ?`;
    variant = updates.status === 'annule' ? 'danger' : 'warning';
    
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      variant,
      onConfirm: () => void performUpdateOrder(updates),
    });
  }

  function requestValidateCommande() {
    setConfirmDialog({
      isOpen: true,
      title: 'Validation de la commande',
      message:
        'Confirmer la validation ? Le statut passera à « Prise en compte ». Le client pourra alors procéder au paiement en ligne si un montant est dû.',
      variant: 'info',
      onConfirm: () => {
        const iso = datetimeLocalToIso(validateScheduledAt);
        void performUpdateOrder({
          status: 'prise_en_compte',
          ...(iso ? { scheduledAt: iso } : {}),
        });
      },
    });
  }

  async function performUpdateOrder(updates: { 
    status?: string; 
    paid?: boolean; 
    technicianId?: string | null;
    partnerCommission?: number | null;
    partnerCommissionType?: 'percentage' | 'fixed' | null;
    scheduledAt?: string | null;
  }) {
    if (!token || !id) return;
    
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      const res = await apiFetch(`/orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        token,
        json: updates,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUpdateError(apiErrorMessage(data, 'Impossible de mettre à jour la commande.'));
        return;
      }
      setOrder(data as OrderDetail);
      setUpdateSuccess('Commande mise à jour avec succès!');
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      setUpdateError(getNetworkErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  function handleTechnicianChange(technicianId: string) {
    void performUpdateOrder({ technicianId: technicianId || null });
  }

  async function saveAnalyseCentres() {
    if (!token || !id || !order?.orderAnalyses?.length) return;

    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      const assignments = order.orderAnalyses.map((line) => ({
        orderAnalyseId: line.id,
        centreId: analyseCentreByLineId[line.id] || null,
      }));
      const res = await apiFetch(
        `/orders/${encodeURIComponent(id)}/analyses-centres`,
        {
          method: 'PATCH',
          token,
          json: { assignments },
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUpdateError(
          apiErrorMessage(data, 'Impossible de mettre à jour les centres par analyse.'),
        );
        return;
      }
      setUpdateSuccess('Centres par analyse mis à jour.');
      setTimeout(() => setUpdateSuccess(null), 3000);
      setOrder(data as OrderDetail);
      const centreByLine: Record<string, string> = {};
      for (const line of (data as OrderDetail).orderAnalyses ?? []) {
        if (line.id && line.centre?.id) {
          centreByLine[line.id] = line.centre.id;
        }
      }
      setAnalyseCentreByLineId(centreByLine);
      const assignedIds = [...new Set(Object.values(centreByLine))];
      if (assignedIds.length === 1) {
        setDefaultAnalyseCentreId(assignedIds[0]);
      }
    } catch (err) {
      setUpdateError(getNetworkErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  function handleAnalyseCentreChange(orderAnalyseId: string, centreId: string) {
    setAnalyseCentreByLineId((prev) => ({
      ...prev,
      [orderAnalyseId]: centreId,
    }));
  }

  function applyDefaultCentreToAll() {
    if (!defaultAnalyseCentreId || !order?.orderAnalyses?.length) return;
    const next: Record<string, string> = {};
    for (const line of order.orderAnalyses) {
      next[line.id] = defaultAnalyseCentreId;
    }
    setAnalyseCentreByLineId(next);
    if (!tariffsLoadedCentreIds.has(defaultAnalyseCentreId)) {
      void loadCentreTariffs(defaultAnalyseCentreId);
    }
  }

  function applyDefaultCentreToUnassigned() {
    if (!defaultAnalyseCentreId || !order?.orderAnalyses?.length) return;
    setAnalyseCentreByLineId((prev) => {
      const next = { ...prev };
      for (const line of order.orderAnalyses ?? []) {
        if (!next[line.id]) {
          next[line.id] = defaultAnalyseCentreId;
        }
      }
      return next;
    });
    if (!tariffsLoadedCentreIds.has(defaultAnalyseCentreId)) {
      void loadCentreTariffs(defaultAnalyseCentreId);
    }
  }

  function handleCommissionSave() {
    const commissionValue = localCommission ? parseFloat(localCommission) : null;
    void performUpdateOrder({ 
      partnerCommission: commissionValue, 
      partnerCommissionType: commissionValue ? localCommissionType : null 
    });
  }

  function toggleFrais(fraisId: string) {
    const newSet = new Set(selectedFraisIds);
    if (newSet.has(fraisId)) {
      newSet.delete(fraisId);
    } else {
      newSet.add(fraisId);
    }
    setSelectedFraisIds(newSet);
  }

  async function saveFraisSelection() {
    if (!token || !id) return;
    
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      const res = await apiFetch(`/orders/${encodeURIComponent(id)}/frais`, {
        method: 'PATCH',
        token,
        json: { fraisSupplementaireIds: Array.from(selectedFraisIds) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUpdateError(apiErrorMessage(data, 'Impossible de mettre à jour les frais supplémentaires.'));
        return;
      }
      setUpdateSuccess('Frais supplémentaires mis à jour avec succès!');
      setTimeout(() => setUpdateSuccess(null), 3000);
      
      const updatedOrder = data as OrderDetail;
      setOrder(updatedOrder);
    } catch (err) {
      setUpdateError(getNetworkErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  async function startFedapayPayment() {
    if (!token || !id) return;
    setFedapayError(null);
    setFedapayBusy(true);
    try {
      const res = await apiFetch(
        `/orders/${encodeURIComponent(id)}/payments/fedapay`,
        { method: 'POST', token },
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        setFedapayError(
          apiErrorMessage(
            data,
            'Le paiement en ligne n’est pas disponible pour le moment.',
          ),
        );
        return;
      }
      if (!res.ok) {
        setFedapayError(apiErrorMessage(data, 'Impossible de démarrer le paiement FedaPay.'));
        return;
      }
      const checkoutUrl = (data as { checkoutUrl?: string }).checkoutUrl;
      if (!checkoutUrl) {
        setFedapayError('Réponse serveur inattendue.');
        return;
      }
      window.location.href = checkoutUrl;
    } catch (err) {
      setFedapayError(getNetworkErrorMessage(err));
    } finally {
      setFedapayBusy(false);
    }
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog?.isOpen ?? false}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm ?? (() => {})}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        variant={confirmDialog?.variant ?? 'info'}
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
      />
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-4 lg:px-8 lg:pb-12">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Détail de la commande
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            {order.codeSuivi ? `Code de suivi: ${order.codeSuivi}` : `ID: ${order.id.substring(0, 8)}...`}
          </p>
        </div>
        <Link href="/office/commandes" className={buttonClassName('secondary')}>
          Retour à la liste
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-3 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-xl font-bold text-white shadow-lg">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {order.amount && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {order.amount} XOF
              </span>
            )}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${order.paid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>
              {order.paid ? (
                <>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Payé
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Non payé
                </>
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Créée le {order.createdAt ? new Date(order.createdAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : '—'}
          </p>
          {order.scheduledAt ? (
            <p className="mt-1 text-xs font-medium text-teal-800">
              Rendez-vous : {formatDateTimeFr(order.scheduledAt)}
            </p>
          ) : null}
        </div>
      </div>

      {order.scheduledAt &&
      ['prise_en_compte', 'programme', 'arrivee_patient', 'remise_centre', 'resultat_rendu'].includes(order.status) ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm text-teal-900">
          <span>
            Consultation planifiée le{' '}
            <strong>{formatDateTimeFr(order.scheduledAt)}</strong>
          </span>
          <Link
            href="/office/rendez-vous"
            className="text-xs font-semibold text-teal-800 underline-offset-2 hover:underline"
          >
            Voir le calendrier
          </Link>
        </div>
      ) : null}

      <div className="mb-4">
        <OrderStatusStepper
          status={order.status}
          interactive={!isClient && canChangeOrderStatus}
          disabled={updating}
          onSelectStatus={(s) => requestUpdateOrder({ status: s })}
          canSelectStatus={
            isAdmin
              ? undefined
              : (next) =>
                  canFieldAgentChangeStatus(orderPerms, order.status, next)
          }
        />
        {!isClient && canCancelOrder && order.status !== 'annule' ? (
          <div className="mt-2 flex justify-end border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => requestUpdateOrder({ status: 'annule' })}
              disabled={updating}
              className="text-xs font-semibold text-red-700 underline decoration-red-300 underline-offset-2 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler la commande
            </button>
          </div>
        ) : null}
      </div>

      {isClient &&
        order &&
        paiementRetour &&
        !order.paid &&
        order.status !== 'annule' &&
        order.status !== 'en_attente' && (
          <div className="mb-3 flex flex-col gap-2 rounded-lg border border-teal-200 bg-teal-50/80 px-3 py-2 text-sm text-teal-900 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Retour depuis FedaPay : la confirmation du paiement peut prendre quelques instants. Vous pouvez rafraîchir le statut ci-dessous.
            </span>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  await syncFedapayAfterReturn();
                  await loadOrder();
                })();
              }}
              className={buttonClassName('secondary')}
            >
              Rafraîchir le statut
            </button>
          </div>
        )}

      {isClient &&
        order &&
        !order.paid &&
        order.status !== 'annule' &&
        order.amount &&
        parseFloat(order.amount) > 0 && (
          <Card className="mb-4 border-teal-200 shadow-sm">
            <CardHeader className="bg-teal-50/50 py-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Paiement en ligne (FedaPay)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              <p className="text-sm text-slate-600">
                Réglez votre commande en toute sécurité via FedaPay (Mobile Money, carte bancaire selon les moyens activés sur votre compte marchand).
              </p>
              <p className="text-sm font-semibold text-slate-800">
                Montant à payer : {order.amount} XOF
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => void startFedapayPayment()}
                  disabled={fedapayBusy}
                >
                  {fedapayBusy ? 'Redirection…' : 'Payer avec FedaPay'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {order && token ? (
        <>
          {(isFieldAgent || isAdmin || isClient) && (
            <OrderIncidentsSection
              orderId={order.id}
              token={token}
              orderStatus={order.status}
              canReport={
                isFieldAgent &&
                order.technicianId != null &&
                order.technicianId === user?.id
              }
              isAdmin={isAdmin}
            />
          )}
          {(isClient || isAdmin || isFieldAgent) && (
            <OrderReviewSection
              orderId={order.id}
              token={token}
              orderStatus={order.status}
              canSubmit={isClient}
              readOnly={!isClient}
            />
          )}
        </>
      ) : null}

      {showGestionPanel && (
        <Card className="mb-4 border-slate-200 shadow-sm">
          <div 
            className="border-b border-slate-100 bg-slate-50 px-6 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors"
            onClick={() => setIsGestionExpanded(!isGestionExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Gestion de la commande
              </div>
              <svg 
                className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${isGestionExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {isGestionExpanded && (
            <CardContent className="space-y-4 pt-4">
          {canAssignAgent ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <GestionAssignmentCard
                title="Agent (technicien)"
                hint="Affectation du technicien ou coursier chargé de la commande."
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              >
                <div className="relative">
                  <select
                    className={gestionSelectClass}
                    value={order.technicianId || ''}
                    onChange={(e) => handleTechnicianChange(e.target.value)}
                    disabled={updating}
                  >
                    <option value="">— Aucun technicien —</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.firstName} {tech.lastName}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </GestionAssignmentCard>
            </div>
          ) : null}

          {canManageFrais && availableFrais.length > 0 && (
            <GestionAssignmentCard
              title="Frais supplémentaires"
              hint="Cochez les lignes à appliquer à la commande, puis enregistrez."
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <div className="flex flex-col gap-2">
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-100 bg-white shadow-inner">
                  {availableFrais.map((frais) => (
                    <label
                      key={frais.id}
                      className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-2 py-1.5 last:border-b-0 hover:bg-teal-50/60 sm:gap-2.5 sm:px-2.5 sm:py-1.5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFraisIds.has(frais.id)}
                        onChange={() => toggleFrais(frais.id)}
                        className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-1 focus:ring-teal-500"
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">
                        {frais.name}
                      </span>
                      <span className="shrink-0 text-xs font-bold tabular-nums text-teal-700">
                        {frais.amount} XOF
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end border-t border-slate-100 pt-2">
                  <Button
                    type="button"
                    onClick={() => void saveFraisSelection()}
                    disabled={updating}
                    className="!px-3 !py-2 text-xs"
                  >
                    {updating ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            </GestionAssignmentCard>
          )}

          <div className="rounded-lg border border-teal-200 bg-teal-50/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calcul des frais
            </div>
            <div className="space-y-2 text-sm">
              {order.service && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Service ({order.service.name})</span>
                  <span className="font-medium text-slate-900">
                    {order.service.price != null && String(order.service.price).trim() !== ''
                      ? order.service.price
                      : '0'}{' '}
                    XOF
                  </span>
                </div>
              )}
              {Array.from(selectedFraisIds).map((fraisId) => {
                const frais = availableFrais.find(f => f.id === fraisId);
                return frais ? (
                  <div key={fraisId} className="flex justify-between">
                    <span className="text-slate-600">{frais.name}</span>
                    <span className="font-medium text-slate-900">{frais.amount} XOF</span>
                  </div>
                ) : null;
              })}
              {sumAnalysesAmount() > 0 ? (
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Analyses ({order.orderAnalyses?.length ?? 0})
                  </span>
                  <span className="font-medium text-slate-900">
                    {sumAnalysesAmount().toLocaleString('fr-FR')} XOF
                  </span>
                </div>
              ) : null}
              {calculateRouteFeeAmount() > 0 ? (
                <div className="flex justify-between">
                  <span className="text-slate-600">Frais de trajet</span>
                  <span className="font-medium text-slate-900">
                    {calculateRouteFeeAmount().toLocaleString('fr-FR')} XOF
                  </span>
                </div>
              ) : null}
              <div className="border-t border-teal-200 pt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Sous-total (service + frais)</span>
                  <span className="text-slate-900">
                    {calculateServiceAndFraisSubtotal().toFixed(2)} XOF
                  </span>
                </div>
              </div>
            </div>
          </div>

          {canManageCommission ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Commission du partenaire (Technicien/Coursier){' '}
                <span className="font-normal text-slate-500">
                  (facultatif — suivi interne, non facturé au client)
                </span>
              </label>
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={localCommission}
                    onChange={(e) => setLocalCommission(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 transition hover:border-teal-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <select
                    value={localCommissionType}
                    onChange={(e) => setLocalCommissionType(e.target.value as 'percentage' | 'fixed')}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 transition hover:border-teal-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="fixed">Valeur fixe (XOF)</option>
                    <option value="percentage">Pourcentage (%)</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleCommissionSave}
                  disabled={updating}
                  className={buttonClassName('primary')}
                >
                  Enregistrer la commission
                </button>
                {localCommission && parseFloat(localCommission) > 0 && (
                  <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900">
                    Montant à répertorier pour le partenaire :{' '}
                    <span className="font-bold">{calculateCommission().toFixed(2)} XOF</span>
                    <span className="mt-1 block text-xs text-blue-800">
                      Ce montant n’ajoute pas au total payé par le client.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : order.partnerCommission ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Commission partenaire :{' '}
              <span className="font-semibold text-slate-900">
                {order.partnerCommission}{' '}
                {order.partnerCommissionType === 'percentage' ? '%' : 'XOF'}
              </span>
            </div>
          ) : null}

          <div className="rounded-lg border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-teal-100/50 p-4">
            <div className="mb-3 space-y-2 text-sm">
              <div className="flex justify-between text-slate-700">
                <span>Sous-total (service + frais)</span>
                <span className="font-medium text-slate-900">
                  {calculateServiceAndFraisSubtotal().toFixed(2)} XOF
                </span>
              </div>
              {sumAnalysesAmount() > 0 ? (
                <div className="flex justify-between text-slate-700">
                  <span>Analyses</span>
                  <span className="font-medium text-slate-900">
                    {sumAnalysesAmount().toLocaleString('fr-FR')} XOF
                  </span>
                </div>
              ) : null}
              {calculateRouteFeeAmount() > 0 ? (
                <div className="flex justify-between text-slate-700">
                  <span>Frais de trajet</span>
                  <span className="font-medium text-slate-900">
                    {calculateRouteFeeAmount().toLocaleString('fr-FR')} XOF
                  </span>
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between border-t border-teal-300 pt-3">
              <div>
                <span className="text-base font-bold text-slate-900">Montant total à payer (client)</span>
                <p className="mt-0.5 text-xs font-normal text-slate-600">
                  Service + frais + analyses + trajet. La commission partenaire reste interne.
                </p>
              </div>
              <span className="text-2xl font-bold text-teal-700">
                {calculateFinalTotal().toFixed(2)} XOF
              </span>
            </div>
          </div>

          {isAdmin &&
          order.status !== 'en_attente' &&
          order.status !== 'annule' ? (
            <div>
              <label
                htmlFor="order-scheduled-at"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Date du rendez-vous
              </label>
              <AppointmentSlotPicker
                id="order-scheduled-at"
                token={token}
                orderId={id}
                technicianId={order.technicianId}
                technicianName={
                  order.technician
                    ? `${order.technician.firstName ?? ''} ${order.technician.lastName ?? ''}`.trim()
                    : null
                }
                value={localScheduledAt}
                onChange={setLocalScheduledAt}
                disabled={updating}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={updating || !localScheduledAt.includes('T')}
                  onClick={() => {
                    const iso = datetimeLocalToIso(localScheduledAt);
                    void performUpdateOrder({ scheduledAt: iso });
                  }}
                  className={buttonClassName('secondary')}
                >
                  Enregistrer le créneau
                </button>
                {order.scheduledAt ? (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => {
                      setLocalScheduledAt('');
                      void performUpdateOrder({ scheduledAt: null });
                    }}
                    className="text-sm font-medium text-slate-600 underline hover:text-slate-900"
                  >
                    Retirer la date
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Visible dans le calendrier dès que la commande est prise en compte.
              </p>
            </div>
          ) : null}

          {canValidateOrder ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Validation de la commande
            </label>
            {order.status === 'en_attente' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Valider fait passer la commande en « Prise en compte ». Le client pourra ensuite utiliser le
                  paiement en ligne lorsque le montant est prêt.
                </p>
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-700">
                    Date du rendez-vous (recommandé)
                  </p>
                  <AppointmentSlotPicker
                    id="validate-scheduled-at"
                    token={token}
                    orderId={id}
                    technicianId={order.technicianId}
                    technicianName={
                      order.technician
                        ? `${order.technician.firstName ?? ''} ${order.technician.lastName ?? ''}`.trim()
                        : null
                    }
                    value={validateScheduledAt}
                    onChange={setValidateScheduledAt}
                    disabled={updating}
                    className="max-w-md"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => requestValidateCommande()}
                  disabled={updating}
                  className={buttonClassName('primary')}
                >
                  Valider la commande
                </button>
              </div>
            ) : (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {order.status === 'prise_en_compte'
                  ? 'Cette commande est déjà prise en compte. Utilisez le sélecteur « Statut de la commande » pour la suite du parcours.'
                  : `Statut actuel : ${statusLabels[order.status]?.label ?? order.status}. La validation rapide ci-dessus ne s’applique qu’aux commandes encore en attente.`}
              </p>
            )}
          </div>
          ) : null}
          </CardContent>
        )}
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 py-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {order.client && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {order.client.firstName} {order.client.lastName}
                  </p>
                  {order.client.email && <p className="text-xs text-slate-600">{order.client.email}</p>}
                </div>
              </div>
            )}
            <ClientLocationDisplay
              address={order.clientAddress}
              latitude={order.clientLatitude}
              longitude={order.clientLongitude}
            />
            {!isClient && (() => {
              const fromAnalyses = (order.orderAnalyses ?? [])
                .map((line) => line.centre)
                .filter(
                  (c): c is NonNullable<typeof c> & { id: string } =>
                    Boolean(c?.id),
                );
              const uniqueFromAnalyses = [
                ...new Map(fromAnalyses.map((c) => [c.id, c])).values(),
              ];
              const displayedCentres =
                uniqueFromAnalyses.length > 0
                  ? uniqueFromAnalyses
                  : order.orderCentres?.map((oc) => oc.centre).filter(Boolean) ??
                    (order.centre ? [order.centre] : []);
              if (displayedCentres.length === 0) return null;
              return (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {displayedCentres.length > 1 ? 'Centres d’analyse' : 'Centre d’analyse'}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {displayedCentres.map((centre) => (
                      <li key={centre!.id} className="text-sm font-medium text-slate-900">
                        {centre!.siteName ?? '—'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              );
            })()}
            {(() => {
              const clientZone = order.zone;

              if (isClient) {
                if (!clientZone?.name) return null;
                return (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Zone du client
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {clientZone.name}
                        {clientZone.code ? (
                          <span className="ml-1 text-xs text-slate-500">({clientZone.code})</span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                );
              }

              const centreZonesFromAnalyses = (order.orderAnalyses ?? [])
                .map((line) => line.centre?.zone)
                .filter(
                  (z): z is { id: string; name?: string | null; code?: string | null } =>
                    Boolean(z),
                );
              const centreZonesFallback = (order.orderCentres ?? [])
                .map((oc) => oc.centre?.zone)
                .filter(
                  (z): z is { id: string; name?: string | null; code?: string | null } =>
                    Boolean(z),
                );
              const centreZones =
                centreZonesFromAnalyses.length > 0
                  ? centreZonesFromAnalyses
                  : centreZonesFallback;
              const uniqueCentreZones = [
                ...new Map(centreZones.map((z) => [z.id, z])).values(),
              ];
              const centresWithoutZone = [
                ...new Map(
                  [
                    ...(order.orderAnalyses ?? []).map((line) => line.centre),
                    ...(order.orderCentres ?? []).map((oc) => oc.centre),
                  ]
                    .filter(
                      (c): c is { id: string; siteName?: string | null; zone?: { id: string } | null } =>
                        Boolean(c?.id && !c.zone?.id),
                    )
                    .map((c) => [c.id, c] as const),
                ).values(),
              ];
              if (!clientZone && uniqueCentreZones.length === 0) return null;

              function formatZone(
                zone: { name?: string | null; code?: string | null } | null | undefined,
              ) {
                if (!zone?.name) return '—';
                return (
                  <>
                    {zone.name}
                    {zone.code ? (
                      <span className="ml-1 text-xs text-slate-500">({zone.code})</span>
                    ) : null}
                  </>
                );
              }

              return (
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Trajet (départ → destination)
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      <span className="text-xs font-normal text-slate-600">Départ (client)</span>{' '}
                      {formatZone(clientZone)}
                      <span className="mx-1 text-slate-400">→</span>
                      <span className="text-xs font-normal text-slate-600">Destination (centre)</span>{' '}
                      {uniqueCentreZones.length === 0 ? (
                        <span className="text-amber-700">
                          — zone du centre non renseignée —
                        </span>
                      ) : uniqueCentreZones.length === 1 ? (
                        formatZone(uniqueCentreZones[0])
                      ) : (
                        <span>{uniqueCentreZones.map((z) => z.name).join(', ')}</span>
                      )}
                    </p>
                    {!clientZone ? (
                      <p className="mt-1 text-xs text-amber-700">
                        Zone client non renseignée sur la commande.
                      </p>
                    ) : null}
                    {clientZone && uniqueCentreZones.length === 0 && !isClient ? (
                      <p className="mt-1 text-xs text-amber-700">
                        {centresWithoutZone.length > 0 ? (
                          <>
                            Le(s) centre(s){' '}
                            <span className="font-medium">
                              {centresWithoutZone.map((c) => c.siteName ?? '—').join(', ')}
                            </span>{' '}
                            {centresWithoutZone.length > 1 ? 'n’ont' : 'n’a'} pas de zone
                            géographique. Renseignez-la dans{' '}
                            <Link
                              href="/office/admin/centres"
                              className="font-semibold text-amber-900 underline"
                            >
                              Admin → Centres
                            </Link>{' '}
                            pour calculer le trajet et les frais associés.
                          </>
                        ) : (
                          <>
                            Assignez un centre d’analyse, puis définissez sa zone dans{' '}
                            <Link
                              href="/office/admin/centres"
                              className="font-semibold text-amber-900 underline"
                            >
                              Admin → Centres
                            </Link>
                            .
                          </>
                        )}
                      </p>
                    ) : null}
                    {clientZone && uniqueCentreZones.length === 0 && isClient ? (
                      <p className="mt-1 text-xs text-slate-600">
                        Les frais de trajet seront calculés après traitement de votre commande par
                        notre équipe.
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 py-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {order.service ? (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nom du service</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{order.service.name ?? '—'}</p>
                  <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-teal-100 bg-teal-50/40 px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Montant catalogue
                    </span>
                    <span className="text-base font-bold tabular-nums text-teal-800">
                      {order.service.price != null && String(order.service.price).trim() !== ''
                        ? order.service.price
                        : '0'}{' '}
                      XOF
                    </span>
                  </div>
                </div>
              </div>
            ) : order.serviceName ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prestation (libellé)</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{order.serviceName}</p>
                {order.amount != null ? (
                  <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Montant
                    </span>
                    <span className="text-base font-bold tabular-nums text-slate-900">
                      {order.amount} XOF
                    </span>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucun service associé</p>
            )}

            {!isClient ? (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Technicien assigné
                </p>
                {order.technician ? (
                  <div className="mt-2 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {order.technician.firstName} {order.technician.lastName}
                      </p>
                      {order.technician.phone ? (
                        <a
                          href={`tel:${order.technician.phone.replace(/\s/g, '')}`}
                          className="mt-0.5 inline-flex items-center gap-1 text-sm text-teal-700 hover:underline"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {order.technician.phone}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm text-slate-500">Téléphone non renseigné</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Aucun technicien assigné pour le moment.</p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {analyses.length > 0 && (
        <Card className="mt-4 border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 py-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Analyses prescrites
              <span className="ml-auto text-xs font-medium text-slate-500">({analyses.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {canManageAnalyseCentres ? (
              <div className="mb-4 space-y-3">
                <p className="text-xs text-slate-600">
                  Choisissez un centre par défaut pour préremplir les analyses, puis affinez ligne par ligne si besoin (disponibilité et tarifs du laboratoire).
                </p>
                <div className="flex flex-wrap items-end gap-3 rounded-lg border border-teal-100 bg-teal-50/40 p-3">
                  <div className="min-w-[14rem] flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Centre par défaut
                    </label>
                    <select
                      className={gestionSelectClass}
                      value={defaultAnalyseCentreId}
                      onChange={(e) => setDefaultAnalyseCentreId(e.target.value)}
                      disabled={updating || centres.length === 0}
                    >
                      <option value="">— Choisir un centre —</option>
                      {centres.map((centre) => (
                        <option key={centre.id} value={centre.id}>
                          {centre.siteName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    onClick={() => applyDefaultCentreToAll()}
                    disabled={updating || !defaultAnalyseCentreId}
                    className="!px-3 !py-2 text-xs"
                  >
                    Appliquer à toutes
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => applyDefaultCentreToUnassigned()}
                    disabled={updating || !defaultAnalyseCentreId}
                    className="!px-3 !py-2 text-xs"
                  >
                    Appliquer aux non assignées
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {analyses.map((line, i) => {
                const selectedCentreId =
                  analyseCentreByLineId[line.id] ?? line.centre?.id ?? '';
                const { price, missing, loading } = resolveAnalyseLinePrice(
                  line,
                  selectedCentreId || undefined,
                  tariffsByCentreId,
                  tariffsLoadedCentreIds,
                );
                const formattedPrice = canManageAnalyseCentres
                  ? formatXof(price)
                  : formatXof(price ?? line.amountSnapshot);

                return (
                <div key={line.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <span className="text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{line.analyse?.name ?? 'Sans nom'}</p>
                      {line.analyse?.code ? (
                        <p className="mt-0.5 text-xs text-slate-600">Code: {line.analyse.code}</p>
                      ) : null}
                    </div>
                  </div>
                  {canManageAnalyseCentres ? (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Centre d’exécution
                      </label>
                      <select
                        className={gestionSelectClass}
                        value={analyseCentreByLineId[line.id] ?? ''}
                        onChange={(e) =>
                          handleAnalyseCentreChange(line.id, e.target.value)
                        }
                        disabled={updating || centres.length === 0}
                      >
                        <option value="">— Non assigné —</option>
                        {centres.map((centre) => (
                          <option key={centre.id} value={centre.id}>
                            {centre.siteName}
                          </option>
                        ))}
                      </select>
                      {!selectedCentreId ? (
                        <p className="mt-1.5 text-xs text-slate-500">
                          Sélectionnez un centre pour afficher le tarif.
                        </p>
                      ) : loading ? (
                        <p className="mt-1.5 text-xs text-slate-500">Chargement du tarif…</p>
                      ) : missing ? (
                        <p className="mt-1.5 text-xs font-medium text-amber-700">
                          Aucun tarif défini pour cette analyse à ce centre.
                        </p>
                      ) : formattedPrice ? (
                        <p className="mt-1.5 text-sm font-bold tabular-nums text-teal-800">
                          {formattedPrice}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      {!isClient && line.centre?.siteName ? (
                        <p className="text-xs text-slate-600">
                          Centre :{' '}
                          <span className="font-medium text-slate-800">{line.centre.siteName}</span>
                        </p>
                      ) : null}
                      {formattedPrice ? (
                        <p className="text-sm font-bold tabular-nums text-teal-800">
                          {formattedPrice}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
                );
              })}
            </div>
            {canManageAnalyseCentres && analyses.length > 0 ? (
              <div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
                <Button
                  type="button"
                  onClick={() => void saveAnalyseCentres()}
                  disabled={updating}
                  className="!px-3 !py-2 text-xs"
                >
                  {updating ? 'Enregistrement…' : 'Enregistrer les centres'}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {frais.length > 0 && (
        <Card className="mt-4 border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 py-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Frais supplémentaires
              <span className="ml-auto text-xs font-medium text-slate-500">({frais.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {frais.map((line, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-sm font-medium text-slate-900">{line.frais?.name ?? 'Sans nom'}</p>
                  <span className="text-sm font-bold text-teal-700">{line.amountSnapshot ?? '—'} XOF</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showBilanDocumentSection && (
        <Card className="mt-4 border-teal-200 bg-teal-50/30 shadow-sm">
          <CardHeader className="bg-teal-50 py-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documents bilan
              <span className="ml-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                {bilanAttachments.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              {bilanAttachments.map((attachment) => (
                <BilanAttachmentPreviewCard
                  key={attachment.id}
                  orderId={id}
                  attachmentId={attachment.id}
                  fileName={attachment.originalName}
                  mimeType={attachment.mimeType}
                  token={token}
                  downloading={bilanDownloadingId === attachment.id}
                  onDownload={() =>
                    void handleDownloadBilan(attachment.id, attachment.originalName)
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}
