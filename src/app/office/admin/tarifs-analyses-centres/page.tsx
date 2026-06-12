'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/providers';
import {
  AdminReferentialAlerts,
  AdminReferentialDataCard,
  AdminReferentialHeader,
  adminDataTableThClass,
  adminDataTableThRightClass,
  adminDeleteRowButtonClass,
  adminEditRowButtonClass,
} from '@/components/admin/AdminReferentialShell';
import { adminFieldClass, adminLabelClass } from '@/components/admin/admin-form-styles';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiErrorMessage } from '@/lib/api-errors';
import { useToastFeedback } from '@/hooks/useToastFeedback';
import {
  downloadTextFile,
  parseTariffsCsv,
  resolveAnalyseFromCsvRow,
  tariffsTemplateCsv,
  tariffsToCsv,
} from '@/lib/centre-analyse-tariffs-csv';
import { Pagination } from '@/components/ui/Pagination';
import { apiFetch } from '@/lib/api/client';
import {
  buildPageQuery,
  DEFAULT_PAGE_SIZE,
  fetchAllPaginatedItems,
  parsePaginatedResponse,
  type PaginationMeta,
} from '@/lib/pagination';
import { publicApiUrl } from '@/lib/env';

type Centre = { id: string; siteName: string };
type Analyse = { id: string; code?: string | null; name: string; active?: boolean };

type Row = {
  id: string;
  price: string;
  currency: string;
  active: boolean;
  centre: Centre;
  analyse: Analyse;
};

export default function AdminTarifsAnalysesCentresPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [listMeta, setListMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
  });
  const [centres, setCentres] = useState<Centre[]>([]);
  const [analyses, setAnalyses] = useState<Analyse[]>([]);
  const [filterCentreId, setFilterCentreId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  const [bulkCentreId, setBulkCentreId] = useState('');
  const [bulkSearch, setBulkSearch] = useState('');
  const [priceByAnalyseId, setPriceByAnalyseId] = useState<Record<string, string>>({});
  const [existingTariffIdByAnalyseId, setExistingTariffIdByAnalyseId] = useState<
    Record<string, string>
  >({});
  const [loadingBulkTariffs, setLoadingBulkTariffs] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCentreId, setImportCentreId] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importErr, setImportErr] = useState<string | null>(null);

  const [ePrice, setEPrice] = useState('');
  const [eCur, setECur] = useState('XOF');
  const [eActive, setEActive] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch(
      `/centre-analyse-tariffs/admin${buildPageQuery({
        page,
        limit: DEFAULT_PAGE_SIZE,
        centreId: filterCentreId || undefined,
      })}`,
      { method: 'GET', token },
    );
    const data = await parsePaginatedResponse<Row>(res);
    setRows(data.items);
    setListMeta(data.meta);
  }, [token, filterCentreId, page]);

  const loadCentres = useCallback(async () => {
    const res = await fetch(`${publicApiUrl()}/centres`);
    const data = await res.json().catch(() => []);
    setCentres(Array.isArray(data) ? data : []);
  }, []);

  const loadAnalyses = useCallback(async () => {
    if (!token) return;
    try {
      const items = await fetchAllPaginatedItems<Analyse>((page, limit) =>
        apiFetch(
          `/analyses/admin${buildPageQuery({ page, limit })}`,
          { method: 'GET', token },
        ),
      );
      setAnalyses(items);
    } catch {
      setAnalyses([]);
    }
  }, [token]);

  const loadAllTariffRows = useCallback(
    async (centreId?: string) => {
      if (!token) return [] as Row[];
      return fetchAllPaginatedItems<Row>((page, limit) =>
        apiFetch(
          `/centre-analyse-tariffs/admin${buildPageQuery({
            page,
            limit,
            centreId: centreId || undefined,
          })}`,
          { method: 'GET', token },
        ),
      );
    },
    [token],
  );

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  useEffect(() => {
    queueMicrotask(() => void loadCentres());
  }, [loadCentres]);

  useEffect(() => {
    queueMicrotask(() => void loadAnalyses());
  }, [loadAnalyses]);

  const activeAnalyses = useMemo(
    () => analyses.filter((a) => a.active !== false),
    [analyses],
  );

  const filteredBulkAnalyses = useMemo(() => {
    const q = bulkSearch.trim().toLowerCase();
    if (!q) return activeAnalyses;
    return activeAnalyses.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.code?.toLowerCase().includes(q) ?? false),
    );
  }, [activeAnalyses, bulkSearch]);

  const bulkPricedCount = useMemo(
    () =>
      activeAnalyses.filter((a) => {
        const n = parseFloat(priceByAnalyseId[a.id] ?? '');
        return Number.isFinite(n) && n > 0;
      }).length,
    [activeAnalyses, priceByAnalyseId],
  );

  useToastFeedback(createErr);
  useToastFeedback(importErr);

  useEffect(() => {
    if (!isCreateModalOpen || !bulkCentreId || !token) {
      return;
    }
    let cancelled = false;
    queueMicrotask(async () => {
      setLoadingBulkTariffs(true);
      try {
        const allRows = await fetchAllPaginatedItems<Row>((page, limit) =>
          apiFetch(
            `/centre-analyse-tariffs/admin${buildPageQuery({
              page,
              limit,
              centreId: bulkCentreId,
            })}`,
            { method: 'GET', token },
          ),
        );
        if (cancelled) return;
        const prices: Record<string, string> = {};
        const ids: Record<string, string> = {};
        for (const row of allRows) {
          if (row.analyse?.id) {
            prices[row.analyse.id] = row.price;
            ids[row.analyse.id] = row.id;
          }
        }
        setPriceByAnalyseId(prices);
        setExistingTariffIdByAnalyseId(ids);
      } finally {
        if (!cancelled) setLoadingBulkTariffs(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isCreateModalOpen, bulkCentreId, token]);

  function openEdit(r: Row) {
    setEditing(r.id);
    setEPrice(r.price);
    setECur(r.currency);
    setEActive(r.active);
    setErr(null);
    setMsg(null);
  }

  function openCreateModal() {
    setCreateErr(null);
    setErr(null);
    setBulkSearch('');
    setBulkCentreId(filterCentreId);
    setPriceByAnalyseId({});
    setExistingTariffIdByAnalyseId({});
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    setCreateErr(null);
    setBulkCentreId('');
    setBulkSearch('');
    setPriceByAnalyseId({});
    setExistingTariffIdByAnalyseId({});
    setIsCreateModalOpen(false);
  }

  function setBulkPrice(analyseId: string, value: string) {
    setPriceByAnalyseId((prev) => ({ ...prev, [analyseId]: value }));
  }

  function parsePositivePrice(raw: string | undefined): number | null {
    if (raw == null || raw.trim() === '') return null;
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }

  async function loadExistingTariffMaps(centreId: string) {
    if (!token) return { prices: {}, ids: {} };
    const allRows = await fetchAllPaginatedItems<Row>((page, limit) =>
      apiFetch(
        `/centre-analyse-tariffs/admin${buildPageQuery({
          page,
          limit,
          centreId,
        })}`,
        { method: 'GET', token },
      ),
    );
    const prices: Record<string, string> = {};
    const ids: Record<string, string> = {};
    for (const row of allRows) {
      if (row.analyse?.id) {
        prices[row.analyse.id] = row.price;
        ids[row.analyse.id] = row.id;
      }
    }
    return { prices, ids };
  }

  async function persistTariffEntries(
    centreId: string,
    entries: { analyse: Analyse; price: number; existingId?: string }[],
  ) {
    if (!token) {
      return { created: 0, updated: 0, failures: ['Session expirée.'] };
    }

    let created = 0;
    let updated = 0;
    const failures: string[] = [];

    for (const entry of entries) {
      const payload = { price: entry.price, currency: 'XOF' };
      const res = entry.existingId
        ? await apiFetch(
            `/centre-analyse-tariffs/${encodeURIComponent(entry.existingId)}`,
            { method: 'PATCH', token, json: payload },
          )
        : await apiFetch('/centre-analyse-tariffs', {
            method: 'POST',
            token,
            json: {
              centreId,
              analyseId: entry.analyse.id,
              ...payload,
              active: true,
            },
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        failures.push(`${entry.analyse.name}: ${apiErrorMessage(data, 'Erreur')}`);
        continue;
      }
      if (entry.existingId) updated += 1;
      else created += 1;
    }

    return { created, updated, failures };
  }

  async function submitBulkCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !bulkCentreId) return;

    const entries = activeAnalyses
      .map((a) => ({
        analyse: a,
        price: parsePositivePrice(priceByAnalyseId[a.id]),
        existingId: existingTariffIdByAnalyseId[a.id],
      }))
      .filter((entry) => entry.price != null) as {
      analyse: Analyse;
      price: number;
      existingId?: string;
    }[];

    if (entries.length === 0) {
      setCreateErr('Saisissez au moins un prix supérieur à 0.');
      return;
    }

    setBusy(true);
    setCreateErr(null);
    setMsg(null);

    const { created, updated, failures } = await persistTariffEntries(
      bulkCentreId,
      entries,
    );
    setBusy(false);

    if (failures.length > 0) {
      setCreateErr(
        failures.length === entries.length
          ? failures.join(' — ')
          : `${created + updated} tarif(s) enregistré(s), ${failures.length} erreur(s) : ${failures.slice(0, 3).join(' — ')}${failures.length > 3 ? '…' : ''}`,
      );
      if (created + updated > 0) await refresh();
      return;
    }

    setMsg(
      `${created + updated} tarif(s) enregistré(s) (${created} créé(s), ${updated} mis à jour).`,
    );
    closeCreateModal();
    await refresh();
  }

  async function handleExportCsv() {
    if (!token) return;
    setBusy(true);
    setErr(null);
    try {
      const exportRows = await loadAllTariffRows(filterCentreId || undefined);
      if (exportRows.length === 0) {
        setErr('Aucun tarif à exporter pour la sélection actuelle.');
        return;
      }
      const slug = filterCentreId
        ? centres.find((c) => c.id === filterCentreId)?.siteName ?? 'centre'
        : 'tous-centres';
      const safeSlug = slug.replace(/[^\w.-]+/g, '_').slice(0, 40);
      downloadTextFile(
        `tarifs-analyses-${safeSlug}-${new Date().toISOString().slice(0, 10)}.csv`,
        tariffsToCsv(exportRows),
      );
      setMsg(`${exportRows.length} tarif(s) exporté(s).`);
    } catch {
      setErr('Export CSV impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function handleExportTemplate(forCentreId?: string) {
    const centreId = forCentreId || filterCentreId || bulkCentreId;
    if (!centreId) {
      setErr('Sélectionnez un centre (filtre) pour télécharger le modèle CSV.');
      return;
    }
    const centre = centres.find((c) => c.id === centreId);
    if (!centre) return;

    if (activeAnalyses.length === 0) {
      setErr('Aucune analyse active disponible pour générer le modèle.');
      return;
    }

    setBusy(true);
    try {
      const { prices } = await loadExistingTariffMaps(centreId);
      const safeSlug = centre.siteName.replace(/[^\w.-]+/g, '_').slice(0, 40);
      downloadTextFile(
        `modele-tarifs-${safeSlug}.csv`,
        tariffsTemplateCsv(centre.siteName, activeAnalyses, prices),
      );
      setMsg(
        `Modèle CSV généré pour ${centre.siteName} (${activeAnalyses.length} analyses).`,
      );
    } catch {
      setErr('Génération du modèle CSV impossible.');
    } finally {
      setBusy(false);
    }
  }

  function openImportModal() {
    setImportErr(null);
    setImportCentreId(filterCentreId);
    setImportFileName('');
    setIsImportModalOpen(true);
  }

  function closeImportModal() {
    setImportErr(null);
    setImportFileName('');
    setIsImportModalOpen(false);
  }

  async function handleImportFile(file: File) {
    if (!token || !importCentreId) return;

    setBusy(true);
    setImportErr(null);
    setMsg(null);

    try {
      const text = await file.text();
      const parsed = parseTariffsCsv(text);
      if (parsed.length === 0) {
        setImportErr('Fichier vide ou format non reconnu.');
        setBusy(false);
        return;
      }

      const { ids: existingIds } = await loadExistingTariffMaps(importCentreId);
      const entries: { analyse: Analyse; price: number; existingId?: string }[] = [];
      const unmatched: string[] = [];

      for (const line of parsed) {
        if (line.price == null) continue;

        const analyse = resolveAnalyseFromCsvRow(line, activeAnalyses);
        if (!analyse) {
          unmatched.push(`Ligne ${line.line}`);
          continue;
        }

        entries.push({
          analyse,
          price: line.price,
          existingId: existingIds[analyse.id],
        });
      }

      if (entries.length === 0) {
        const parts = [];
        if (unmatched.length > 0) {
          parts.push(`Analyses non reconnues : ${unmatched.slice(0, 5).join(', ')}${unmatched.length > 5 ? '…' : ''}`);
        }
        parts.push('Aucune ligne avec prix > 0 à importer.');
        setImportErr(parts.join(' '));
        setBusy(false);
        return;
      }

      const { created, updated, failures } = await persistTariffEntries(
        importCentreId,
        entries,
      );

      setBusy(false);

      if (failures.length > 0) {
        setImportErr(
          `${created + updated} importé(s), ${failures.length} erreur(s) : ${failures.slice(0, 3).join(' — ')}${failures.length > 3 ? '…' : ''}`,
        );
        if (created + updated > 0) await refresh();
        return;
      }

      const centreName = centres.find((c) => c.id === importCentreId)?.siteName ?? '';
      let summary = `${created + updated} tarif(s) importé(s) pour ${centreName} (${created} créé(s), ${updated} mis à jour).`;
      if (unmatched.length > 0) {
        summary += ` ${unmatched.length} ligne(s) ignorée(s) (analyse introuvable).`;
      }
      setMsg(summary);
      closeImportModal();
      await refresh();
    } catch {
      setImportErr('Lecture du fichier impossible.');
      setBusy(false);
    }
  }

  async function submitEdit(id: string, e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    const res = await apiFetch(`/centre-analyse-tariffs/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      json: {
        price: Number(ePrice) || 0,
        currency: eCur.trim() || undefined,
        active: eActive,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(apiErrorMessage(data, 'Mise à jour impossible.'));
      setBusy(false);
      return;
    }
    setEditing(null);
    setMsg('Tarif mis à jour.');
    await refresh();
    setBusy(false);
  }

  async function remove(id: string) {
    if (!token || !window.confirm('Supprimer ce tarif ?')) return;
    setBusy(true);
    const res = await apiFetch(`/centre-analyse-tariffs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(apiErrorMessage(data, 'Suppression impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Tarif supprimé.');
    setEditing(null);
    await refresh();
    setBusy(false);
  }

  return (
    <div>
      <AdminReferentialHeader
        title="Tarifs analyses par centre"
        description="Prix de chaque analyse selon le laboratoire — utilisé pour le calcul du montant des commandes."
        actionLabel="Configurer un centre"
        onAction={openCreateModal}
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 lg:px-8">
        <AdminReferentialAlerts
          err={err}
          msg={msg}
          onDismissErr={() => setErr(null)}
          onDismissMsg={() => setMsg(null)}
        />

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[14rem] flex-1 sm:max-w-xs">
            <label className={adminLabelClass}>Filtrer par centre</label>
            <select
              className={adminFieldClass}
              value={filterCentreId}
              onChange={(e) => {
                setFilterCentreId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous les centres</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.siteName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 pb-0.5">
            <Button
              type="button"
              variant="secondary"
              disabled={busy || listMeta.total === 0}
              onClick={() => void handleExportCsv()}
            >
              Exporter CSV
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void handleExportTemplate()}
            >
              Modèle CSV
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={openImportModal}>
              Importer CSV
            </Button>
          </div>
        </div>

        <Modal
          isOpen={isImportModalOpen}
          onClose={closeImportModal}
          title="Importer des tarifs (CSV)"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Fichier CSV (séparateur <code className="text-xs">;</code> ou{' '}
              <code className="text-xs">,</code>) avec colonnes{' '}
              <strong>code_analyse</strong> ou <strong>nom_analyse</strong>, et{' '}
              <strong>prix</strong>. Les lignes vides ou à 0 sont ignorées. Les tarifs
              existants sont mis à jour.
            </p>
            <div>
              <label className={adminLabelClass}>Centre cible</label>
              <select
                className={adminFieldClass}
                required
                value={importCentreId}
                onChange={(e) => setImportCentreId(e.target.value)}
              >
                <option value="">— Choisir un centre —</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.siteName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={adminLabelClass}>Fichier CSV</label>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                className={adminFieldClass}
                disabled={busy || !importCentreId}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImportFileName(file.name);
                  void handleImportFile(file);
                  e.target.value = '';
                }}
              />
              {importFileName ? (
                <p className="mt-1 text-xs text-slate-500">Dernier fichier : {importFileName}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="secondary"
                disabled={busy || !importCentreId}
                onClick={() => void handleExportTemplate(importCentreId)}
              >
                Télécharger le modèle
              </Button>
              <Button type="button" variant="secondary" onClick={closeImportModal} disabled={busy}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          title="Tarifs analyse / centre"
          size="xl"
        >
          <form onSubmit={(e) => void submitBulkCreate(e)} className="space-y-4">
            <p className="text-sm text-slate-600">
              Choisissez un centre, puis saisissez les prix (XOF) devant chaque analyse.
              Les lignes vides ou à 0 ne sont pas enregistrées. Les tarifs existants sont
              pré-remplis et mis à jour à l’enregistrement.
            </p>
            <div>
              <label className={adminLabelClass}>Centre</label>
              <select
                className={adminFieldClass}
                required
                value={bulkCentreId}
                onChange={(e) => setBulkCentreId(e.target.value)}
              >
                <option value="">— Choisir un centre —</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.siteName}
                  </option>
                ))}
              </select>
            </div>

            {bulkCentreId ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-[14rem] flex-1">
                    <label className={adminLabelClass}>Rechercher une analyse</label>
                    <input
                      type="search"
                      className={adminFieldClass}
                      placeholder="Nom ou code…"
                      value={bulkSearch}
                      onChange={(e) => setBulkSearch(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {bulkPricedCount} prix saisi{bulkPricedCount > 1 ? 's' : ''} ·{' '}
                    {filteredBulkAnalyses.length} / {activeAnalyses.length} analyses · XOF
                  </p>
                </div>

                <div className="max-h-[min(24rem,55vh)] overflow-y-auto rounded-xl border border-slate-200">
                  {loadingBulkTariffs ? (
                    <p className="px-4 py-10 text-center text-sm text-slate-500">
                      Chargement des tarifs du centre…
                    </p>
                  ) : filteredBulkAnalyses.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-slate-500">
                      Aucune analyse active ne correspond à la recherche.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {filteredBulkAnalyses.map((a) => {
                        const hasExisting = Boolean(existingTariffIdByAnalyseId[a.id]);
                        return (
                          <li
                            key={a.id}
                            className="flex flex-wrap items-center gap-3 px-3 py-2.5 hover:bg-slate-50/80 sm:px-4"
                          >
                            <div className="w-28 shrink-0 sm:w-32">
                              <label className="sr-only" htmlFor={`bulk-price-${a.id}`}>
                                Prix pour {a.name}
                              </label>
                              <input
                                id={`bulk-price-${a.id}`}
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                placeholder="—"
                                className={`${adminFieldClass} !py-1.5 text-right tabular-nums`}
                                value={priceByAnalyseId[a.id] ?? ''}
                                onChange={(e) => setBulkPrice(a.id, e.target.value)}
                                disabled={busy}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900">{a.name}</p>
                              {a.code ? (
                                <p className="text-xs text-slate-500">{a.code}</p>
                              ) : null}
                            </div>
                            {hasExisting ? (
                              <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-800 ring-1 ring-teal-200/80">
                                Existant
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Sélectionnez un centre pour afficher la liste des analyses.
              </p>
            )}

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <Button type="submit" disabled={busy || !bulkCentreId || loadingBulkTariffs}>
                {busy ? 'Enregistrement…' : 'Enregistrer tout'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={closeCreateModal}
                disabled={busy}
              >
                Annuler
              </Button>
            </div>
          </form>
        </Modal>

        <AdminReferentialDataCard
          listTitle="Grille tarifaire"
          listIcon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
          countLabel={`${rows.length} tarif${rows.length > 1 ? 's' : ''}`}
        >
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
              <tr>
                <th className={adminDataTableThClass}>Centre</th>
                <th className={adminDataTableThClass}>Analyse</th>
                <th className={adminDataTableThRightClass}>Prix</th>
                <th className={adminDataTableThClass}>Statut</th>
                <th className={adminDataTableThRightClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) =>
                editing === r.id ? (
                  <tr key={r.id} className="bg-teal-50/40">
                    <td className="px-4 py-3 font-medium text-slate-800">{r.centre.siteName}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.analyse.name}
                      {r.analyse.code ? (
                        <span className="ml-1 text-xs text-slate-500">({r.analyse.code})</span>
                      ) : null}
                    </td>
                    <td colSpan={3} className="px-4 py-3">
                      <form
                        onSubmit={(e) => void submitEdit(r.id, e)}
                        className="flex flex-wrap items-end gap-3"
                      >
                        <div>
                          <label className="text-xs text-slate-500">Montant</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            className={`${adminFieldClass} !py-1.5`}
                            value={ePrice}
                            onChange={(e) => setEPrice(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">Devise</label>
                          <input
                            className={`${adminFieldClass} !py-1.5`}
                            value={eCur}
                            onChange={(e) => setECur(e.target.value)}
                          />
                        </div>
                        <label className="flex items-center gap-1.5 pb-1.5 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={eActive}
                            onChange={(e) => setEActive(e.target.checked)}
                          />
                          Actif
                        </label>
                        <Button type="submit" className="!px-3 !py-1.5 !text-xs" disabled={busy}>
                          Enregistrer
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="!px-3 !py-1.5 !text-xs"
                          onClick={() => setEditing(null)}
                          disabled={busy}
                        >
                          Annuler
                        </Button>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-800">{r.centre.siteName}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.analyse.name}
                      {r.analyse.code ? (
                        <span className="ml-1 text-xs text-slate-500">({r.analyse.code})</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800">
                      {Number(r.price).toLocaleString('fr-FR')} {r.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.active
                            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
                        }`}
                      >
                        {r.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button type="button" className={adminEditRowButtonClass} onClick={() => openEdit(r)}>
                          Modifier
                        </button>
                        <button
                          type="button"
                          className={adminDeleteRowButtonClass}
                          onClick={() => void remove(r.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Aucun tarif défini. Utilisez « Configurer un centre » pour saisir les prix.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-4">
            <Pagination meta={listMeta} disabled={busy} onPageChange={setPage} />
          </div>
        </AdminReferentialDataCard>
      </div>
    </div>
  );
}
