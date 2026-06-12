'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { Pagination } from '@/components/ui/Pagination';
import { apiFetch } from '@/lib/api/client';
import {
  buildPageQuery,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
  type PaginationMeta,
} from '@/lib/pagination';
import { publicApiUrl } from '@/lib/env';

type Zone = { id: string; name: string; code?: string | null; active?: boolean };

type Row = {
  id: string;
  price: string;
  currency: string;
  fromZone: Zone;
  toZone: Zone;
};

export default function AdminZoneTrajetsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [listMeta, setListMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
  });
  const [zones, setZones] = useState<Zone[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('XOF');

  const [eFrom, setEFrom] = useState('');
  const [eTo, setETo] = useState('');
  const [ePrice, setEPrice] = useState('');
  const [eCur, setECur] = useState('XOF');

  const refresh = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch(
      `/zone-route-tariffs/admin${buildPageQuery({ page, limit: DEFAULT_PAGE_SIZE })}`,
      { method: 'GET', token },
    );
    const data = await parsePaginatedResponse<Row>(res);
    setRows(data.items);
    setListMeta(data.meta);
  }, [token, page]);

  const loadZones = useCallback(async () => {
    const res = await fetch(`${publicApiUrl()}/zones`);
    const data = await res.json().catch(() => []);
    setZones(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  useEffect(() => {
    queueMicrotask(() => void loadZones());
  }, [loadZones]);

  useToastFeedback(createErr);

  function openEdit(r: Row) {
    setEditing(r.id);
    setEFrom(r.fromZone.id);
    setETo(r.toZone.id);
    setEPrice(r.price);
    setECur(r.currency);
    setErr(null);
    setMsg(null);
  }

  function openCreateModal() {
    setCreateErr(null);
    setErr(null);
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    setCreateErr(null);
    setIsCreateModalOpen(false);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setCreateErr(null);
    setMsg(null);
    const res = await apiFetch('/zone-route-tariffs', {
      method: 'POST',
      token,
      json: {
        fromZoneId: fromId,
        toZoneId: toId,
        price: Number(price) || 0,
        currency: currency.trim() || undefined,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCreateErr(apiErrorMessage(data, 'Création impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Tarif de trajet enregistré.');
    setFromId('');
    setToId('');
    setPrice('0');
    setIsCreateModalOpen(false);
    await refresh();
    setBusy(false);
  }

  async function submitEdit(id: string, e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    const res = await apiFetch(`/zone-route-tariffs/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      json: {
        fromZoneId: eFrom,
        toZoneId: eTo,
        price: Number(ePrice) || 0,
        currency: eCur.trim() || undefined,
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
    if (!token || !window.confirm('Supprimer ce tarif de trajet ?')) return;
    setBusy(true);
    const res = await apiFetch(`/zone-route-tariffs/${encodeURIComponent(id)}`, {
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

  const zoneOptions = zones.filter((z) => z.active !== false);

  return (
    <div>
      <AdminReferentialHeader
        title="Tarifs trajet entre zones"
        description="Prix pour une paire de zones — identique dans les deux sens (ex. Cotonou → Calavi et Calavi → Cotonou partagent le même montant)."
        actionLabel="Nouveau tarif"
        onAction={openCreateModal}
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
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

        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          title="Nouveau tarif trajet"
          size="md"
        >
          <form onSubmit={(e) => void submitCreate(e)} className="space-y-4">
            <div>
              <label className={adminLabelClass}>Zone départ</label>
              <select
                className={adminFieldClass}
                required
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
              >
                <option value="">— Choisir —</option>
                {zoneOptions.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                    {z.code ? ` (${z.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={adminLabelClass}>Zone arrivée</label>
              <select
                className={adminFieldClass}
                required
                value={toId}
                onChange={(e) => setToId(e.target.value)}
              >
                <option value="">— Choisir —</option>
                {zoneOptions.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                    {z.code ? ` (${z.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={adminLabelClass}>Montant</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className={adminFieldClass}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
             <div>
               <label className={adminLabelClass}>Devise</label>
               <input className={adminFieldClass} value={currency} onChange={(e) => setCurrency(e.target.value)} />
             </div>
            </div>
            <p className="text-xs text-slate-600">
              Le tarif est <strong className="font-semibold text-slate-800">réciproque</strong> : en définissant A → B, le trajet B → A est automatiquement au même montant. Même
              zone : trajet gratuit sans ligne.
            </p>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={busy || fromId === toId}>
                {busy ? 'Enregistrement…' : 'Créer'}
              </Button>
              <Button type="button" variant="secondary" onClick={closeCreateModal} disabled={busy}>
                Annuler
              </Button>
            </div>
          </form>
        </Modal>

        <AdminReferentialDataCard
          listTitle="Grille des trajets"
          listIcon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          }
          countLabel={`${rows.length} liaison${rows.length > 1 ? 's' : ''}`}
        >
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
              <tr>
                <th className={adminDataTableThClass}>Départ → arrivée</th>
                <th className={adminDataTableThClass}>Montant</th>
                <th className={adminDataTableThRightClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-slate-900">
                      {r.fromZone.name} → {r.toZone.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(r.fromZone.code ?? '—') + ' → ' + (r.toZone.code ?? '—')}
                    </p>
                    {editing === r.id ? (
                      <form
                        className="mt-3 space-y-2 rounded-lg border border-teal-200 bg-teal-50/30 p-3"
                        onSubmit={(e) => void submitEdit(r.id, e)}
                      >
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Départ</label>
                            <select
                              className={adminFieldClass}
                              required
                              value={eFrom}
                              onChange={(e) => setEFrom(e.target.value)}
                            >
                              {zoneOptions.map((z) => (
                                <option key={z.id} value={z.id}>
                                  {z.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Arrivée</label>
                            <select
                              className={adminFieldClass}
                              required
                              value={eTo}
                              onChange={(e) => setETo(e.target.value)}
                            >
                              {zoneOptions.map((z) => (
                                <option key={z.id} value={z.id}>
                                  {z.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Montant</label>
                            <input
                              type="number"
                              min={0}
                              className={adminFieldClass}
                              value={ePrice}
                              onChange={(e) => setEPrice(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Devise</label>
                            <input className={adminFieldClass} value={eCur} onChange={(e) => setECur(e.target.value)} />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button type="submit" disabled={busy || eFrom === eTo} className="flex-1">
                            {busy ? '…' : 'Enregistrer'}
                          </Button>
                          <Button type="button" variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
                            Annuler
                          </Button>
                        </div>
                      </form>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-900">
                    {r.price} {r.currency}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {editing === r.id ? (
                        <span className="text-xs italic text-slate-500">Édition…</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            disabled={busy || editing !== null}
                            className={adminEditRowButtonClass}
                          >
                            Éditer
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(r.id)}
                            disabled={busy || editing !== null}
                            className={adminDeleteRowButtonClass}
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun tarif de trajet défini.</p>
          ) : null}
          <div className="border-t border-slate-100 px-4 py-4">
            <Pagination meta={listMeta} disabled={busy} onPageChange={setPage} />
          </div>
        </AdminReferentialDataCard>
      </div>
    </div>
  );
}
