'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Filter,
  Inbox,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Stethoscope,
  TestTube2,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { Button, buttonClassName } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { apiFetch } from '@/lib/api/client';
import {
  buildPageQuery,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
  type PaginationMeta,
} from '@/lib/pagination';
import { orderStatusBadgeClass, orderStatusLabel } from '@/lib/order-status';
import { apiErrorMessage, getNetworkErrorMessage } from '@/lib/api-errors';
import { useToastFeedback } from '@/hooks/useToastFeedback';
import { adminFieldClass, adminLabelClass } from '@/components/admin/admin-form-styles';
import { isStaffAdmin } from '@/lib/types/auth';
import { publicApiUrl } from '@/lib/env';
import { serviceNameIndicatesBilan } from '@/lib/bilan-service';
import { AnalysesMultiSelect } from '@/components/office/AnalysesMultiSelect';
import { BilanDocumentUpload } from '@/components/office/BilanDocumentUpload';
import { ServiceSelectButtons } from '@/components/office/ServiceSelectButtons';
import { ClientLocationPicker } from '@/components/office/ClientLocationPicker';
import {
  EMPTY_CLIENT_LOCATION,
  hasClientCoordinates,
  roundCoordinate,
  type ClientLocationValue,
} from '@/lib/client-location';

type OrderRow = {
  id: string;
  codeSuivi?: string | null;
  serviceName?: string | null;
  service?: { name?: string | null } | null;
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
  orderCentres?: {
    centre?: {
      zone?: { name?: string | null; code?: string | null } | null;
    } | null;
  }[];
};

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Zone = {
  id: string;
  name: string;
  code?: string | null;
};

type Service = {
  id: string;
  name: string;
  /** Prix catalogue renvoyé par l’API (`/services`). */
  price?: string | number | null;
  /** Ancien nom éventuel côté front (évité si `price` est présent). */
  basePrice?: string | number | null;
  active?: boolean;
};

type Analyse = {
  id: string;
  name: string;
  code?: string | null;
  active?: boolean;
};

function FieldLabel({
  htmlFor,
  icon: Icon,
  children,
}: {
  htmlFor?: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`${adminLabelClass} inline-flex items-center gap-1.5`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden />
      {children}
    </label>
  );
}

function SectionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

export default function CommandesPage() {
  const searchParams = useSearchParams();
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | undefined>(undefined);
  const [listMeta, setListMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  const [clientId, setClientId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [analyseIds, setAnalyseIds] = useState<string[]>([]);
  const [bilanFiles, setBilanFiles] = useState<File[]>([]);
  const [clientLocation, setClientLocation] =
    useState<ClientLocationValue>(EMPTY_CLIENT_LOCATION);

  const [clients, setClients] = useState<Client[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [analyses, setAnalyses] = useState<Analyse[]>([]);

  const listQueryParams = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: statusFilter !== 'tous' ? statusFilter : undefined,
      dateFrom: dateDebut || undefined,
      dateTo: dateFin || undefined,
    }),
    [page, debouncedSearch, statusFilter, dateDebut, dateFin],
  );

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setError(null);
    setOrders(undefined);
    try {
      const res = await apiFetch(`/orders${buildPageQuery(listQueryParams)}`, {
        method: 'GET',
        token,
      });
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
      setListMeta(data.meta);
    } catch (err) {
      setError(getNetworkErrorMessage(err));
      setOrders([]);
    }
  }, [token, listQueryParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    if (searchParams.get('open') !== 'create') return;
    setShowCreateForm(true);
    const presetService = searchParams.get('serviceId');
    const presetZone = searchParams.get('zoneId');
    if (presetService) setServiceId(presetService);
    if (presetZone) setZoneId(presetZone);
  }, [searchParams]);

  useEffect(() => {
    if (!token || !showCreateForm) return;
    
    queueMicrotask(async () => {
      try {
        if (isStaffAdmin(user?.role)) {
          const resClients = await apiFetch(
            '/users?role=client&limit=500',
            { method: 'GET', token },
          );
          if (resClients.ok) {
            const dataClients = await parsePaginatedResponse<Client>(resClients);
            setClients(dataClients.items);
          }
        }

        const resZones = await fetch(`${publicApiUrl()}/zones`);
        if (resZones.ok) {
          const dataZones = await resZones.json();
          setZones(Array.isArray(dataZones) ? dataZones.filter((z: any) => z.active) : []);
        }

        const resServices = await fetch(`${publicApiUrl()}/services`);
        if (resServices.ok) {
          const dataServices = await resServices.json();
          setServices(Array.isArray(dataServices) ? dataServices.filter((s: any) => s.active) : []);
        }

        const resAnalyses = await fetch(`${publicApiUrl()}/analyses`);
        if (resAnalyses.ok) {
          const dataAnalyses = await resAnalyses.json();
          setAnalyses(Array.isArray(dataAnalyses) ? dataAnalyses.filter((a: any) => a.active) : []);
        }
      } catch (err) {
        console.error('Erreur chargement entités:', err);
      }
    });
  }, [token, showCreateForm, user?.role]);

  useToastFeedback(error ?? formError, formSuccess);

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (!serviceId) {
      setFormError('Veuillez sélectionner un service.');
      return;
    }
    
    setFormBusy(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const payload: Record<string, unknown> = {};
      
      if (isStaffAdmin(user?.role) && clientId) {
        payload.clientId = clientId;
      }
      if (zoneId) payload.zoneId = zoneId;
      if (clientLocation.address.trim()) {
        payload.clientAddress = clientLocation.address.trim();
      }
      if (hasClientCoordinates(clientLocation)) {
        payload.clientLatitude = roundCoordinate(clientLocation.latitude);
        payload.clientLongitude = roundCoordinate(clientLocation.longitude);
      }
      if (serviceId) payload.serviceId = serviceId;
      
      const selectedService = services.find((s) => s.id === serviceId);
      if (
        serviceNameIndicatesBilan(selectedService?.name) &&
        analyseIds.length > 0
      ) {
        payload.analyseIds = analyseIds;
      }

      if (
        bilanFiles.length > 0 &&
        serviceNameIndicatesBilan(selectedService?.name)
      ) {
        const totalBilanBytes = bilanFiles.reduce((sum, file) => sum + file.size, 0);
        if (totalBilanBytes > 100 * 1024 * 1024) {
          setFormError(
            'Les documents bilan dépassent 100 Mo au total. Retirez ou compressez des fichiers.',
          );
          setFormBusy(false);
          return;
        }

        const bilanDocuments = await Promise.all(
          bilanFiles.map(async (file) => {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                const comma = result.indexOf(',');
                resolve(comma >= 0 ? result.slice(comma + 1) : result);
              };
              reader.onerror = () => reject(new Error('Erreur lecture fichier'));
              reader.readAsDataURL(file);
            });
            return { fileName: file.name, base64 };
          }),
        );
        payload.bilanDocuments = bilanDocuments;
      }

      const res = await apiFetch('/orders', {
        method: 'POST',
        token,
        json: payload,
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        if (res.status === 413) {
          setFormError(
            'Les documents sont trop volumineux pour le serveur. Réduisez la taille ou le nombre de fichiers bilan (max 10 Mo chacun).',
          );
        } else {
          setFormError(apiErrorMessage(data, 'Impossible de créer la commande.'));
        }
        setFormBusy(false);
        return;
      }

      setFormSuccess('Commande créée avec succès!');
      setClientId('');
      setZoneId('');
      setServiceId('');
      setAnalyseIds([]);
      setBilanFiles([]);
      setClientLocation(EMPTY_CLIENT_LOCATION);
      
      await load();
      
      setTimeout(() => {
        setShowCreateForm(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err) {
      setFormError(getNetworkErrorMessage(err));
    } finally {
      setFormBusy(false);
    }
  }

  const bilanServiceSelected = serviceNameIndicatesBilan(
    services.find((s) => s.id === serviceId)?.name,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-14 pt-6 lg:px-8 lg:pb-16">
      <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <SectionIcon icon={ClipboardList} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Commandes
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Gestion de vos dossiers et demandes
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className={`${buttonClassName('secondary')} gap-2`}
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            Actualiser
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`${buttonClassName('primary')} gap-2`}
          >
            {showCreateForm ? (
              <>
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Annuler
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                Nouvelle commande
              </>
            )}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <Card className="mb-6 border-teal-200 shadow-sm">
          <CardHeader className="bg-teal-50/50">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <SectionIcon icon={CalendarCheck} />
                Réserver une consultation
              </CardTitle>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/80 hover:text-slate-600"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={(e) => void handleCreateOrder(e)} className="space-y-4">
              <div>
                <FieldLabel icon={Stethoscope}>Type de consultation</FieldLabel>
                <div className="mt-2">
                  <ServiceSelectButtons
                    services={services}
                    value={serviceId}
                    disabled={formBusy}
                    onChange={(id) => {
                      setServiceId(id);
                      setAnalyseIds([]);
                      setBilanFiles([]);
                    }}
                  />
                </div>
                {!serviceId && (
                  <p className="mt-2 text-xs text-slate-500">
                    Cliquez sur un service pour commencer la commande.
                  </p>
                )}
              </div>

              {isStaffAdmin(user?.role) && (
                <div>
                  <FieldLabel icon={User}>Client</FieldLabel>
                  <select
                    className={adminFieldClass}
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  >
                    <option value="">-- Sélectionner un client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.email})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Pour un administrateur, le client est obligatoire
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                  <div>
                    <FieldLabel icon={MapPin}>Localisation du client (optionnel)</FieldLabel>
                    <p className="mt-1 text-xs text-slate-500">
                      Adresse, carte et repère pour le point de prélèvement.
                    </p>
                  </div>
                  <div>
                    <FieldLabel icon={MapPin}>Zone du client (optionnel)</FieldLabel>
                    <select
                      className={adminFieldClass}
                      value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)}
                    >
                      <option value="">-- Aucune zone --</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} {z.code ? `(${z.code})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      Secteur pour le calcul des frais de trajet. Complément de la localisation sur la carte.
                    </p>
                  </div>
                </div>

                <ClientLocationPicker
                  value={clientLocation}
                  onChange={setClientLocation}
                  disabled={formBusy}
                  hideHeader
                />
              </div>

              {bilanServiceSelected && (
                <div>
                  <FieldLabel htmlFor="create-order-analyses" icon={TestTube2}>
                    Analyses à inclure
                  </FieldLabel>
                  <AnalysesMultiSelect
                    inputId="create-order-analyses"
                    analyses={analyses}
                    value={analyseIds}
                    onChange={setAnalyseIds}
                    disabled={formBusy}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Saisie pour filtrer, plusieurs choix possibles. Retirer une étiquette pour désélectionner.
                  </p>
                </div>
              )}

              {bilanServiceSelected ? (
                <BilanDocumentUpload
                  value={bilanFiles}
                  onChange={setBilanFiles}
                  disabled={formBusy}
                  onError={setFormError}
                />
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={formBusy || !serviceId}
                  className="inline-flex gap-2"
                >
                  <CalendarCheck className="h-4 w-4 shrink-0" aria-hidden />
                  {formBusy ? 'Création…' : 'Réserver la consultation'}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className={`${buttonClassName('secondary')} gap-2`}
                  disabled={formBusy}
                >
                  <X className="h-4 w-4 shrink-0" aria-hidden />
                  Annuler
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {orders === undefined ? (
        <p className="mt-10 text-sm text-slate-500">Chargement des dossiers commandes…</p>
      ) : listMeta.total === 0 && !searchQuery && statusFilter === 'tous' && !dateDebut && !dateFin ? (
        <Card className="mt-10">
          <CardContent className="flex flex-col items-center py-12 text-center text-sm text-slate-600">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Inbox className="h-6 w-6" aria-hidden />
            </span>
            Aucune commande pour le moment. Les nouvelles demandes apparaîtront ici.
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="bg-white pb-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <SectionIcon icon={ClipboardList} />
                  Liste des commandes
                </CardTitle>
                <CardDescription className="mt-1">
                  {listMeta.total} dossier{listMeta.total > 1 ? 's' : ''}
                  {listMeta.totalPages > 1
                    ? ` — page ${listMeta.page} / ${listMeta.totalPages}`
                    : ''}
                </CardDescription>
              </div>
              <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                Aujourd&apos;hui
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Rechercher une commande..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('tous');
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      statusFilter === 'tous'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Filter className="h-4 w-4 shrink-0" aria-hidden />
                    Tous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('actives');
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      statusFilter === 'actives'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Clock3 className="h-4 w-4 shrink-0" aria-hidden />
                    En cours
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('resultat_rendu');
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      statusFilter === 'resultat_rendu'
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                    Terminées
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <CalendarRange className="h-4 w-4 text-teal-700" aria-hidden />
                  Période
                </span>
                <div className="flex items-center gap-2">
                  <label htmlFor="date-debut" className="text-sm text-slate-600">Du</label>
                  <input
                    id="date-debut"
                    type="date"
                    value={dateDebut}
                    onChange={(e) => {
                      setDateDebut(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="date-fin" className="text-sm text-slate-600">au</label>
                  <input
                    id="date-fin"
                    type="date"
                    value={dateFin}
                    onChange={(e) => {
                      setDateFin(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                {(dateDebut || dateFin) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDateDebut('');
                      setDateFin('');
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 underline hover:text-teal-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    Réinitialiser les dates
                  </button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="!px-0 !pb-0 !pt-0">
            {(orders?.length ?? 0) === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-600">
                Aucun résultat trouvé pour ces critères.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-y border-slate-100 bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Code de suivi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Zones (trajet)
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
                    {(orders ?? []).map((o) => (
                      <tr key={o.id} className="transition hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-mono text-sm font-semibold text-teal-700">
                              {o.codeSuivi ?? `${o.id.slice(0, 8)}…`}
                            </p>
                            {(o.service?.name ?? o.serviceName) ? (
                              <p className="text-xs text-slate-500">
                                {o.service?.name ?? o.serviceName}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {o.client ? (
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {o.client.firstName} {o.client.lastName}
                              </p>
                              <p className="text-xs text-slate-500">{o.client.email}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const centreZone = o.orderCentres?.[0]?.centre?.zone;
                            if (!o.zone && !centreZone) {
                              return <span className="text-sm text-slate-400">—</span>;
                            }
                            return (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                                {o.zone?.name ?? '—'} → {centreZone?.name ?? '—'}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900">
                            {o.amount ? `${o.amount} XOF` : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
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
                            <ChevronRight className="h-4 w-4" aria-hidden />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-slate-100 px-6 py-4">
              <Pagination
                meta={listMeta}
                disabled={orders === undefined}
                onPageChange={setPage}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
