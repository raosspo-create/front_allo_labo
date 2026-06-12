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
import { Pagination } from '@/components/ui/Pagination';
import { apiFetch } from '@/lib/api/client';
import {
  buildPageQuery,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
  type PaginationMeta,
} from '@/lib/pagination';

type Service = {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  currency: string;
  duration?: string | null;
  category?: string | null;
  active: boolean;
};

export default function AdminServicesPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Service[]>([]);
  const [page, setPage] = useState(1);
  const [listMeta, setListMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('XOF');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);

  const [eName, setEName] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [ePrice, setEPrice] = useState('');
  const [eCur, setECur] = useState('XOF');
  const [eDur, setEDur] = useState('');
  const [eCat, setECat] = useState('');
  const [eActive, setEActive] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) {
      return;
    }
    const res = await apiFetch(
      `/services/admin${buildPageQuery({ page, limit: DEFAULT_PAGE_SIZE })}`,
      { method: 'GET', token },
    );
    const data = await parsePaginatedResponse<Service>(res);
    setRows(data.items);
    setListMeta(data.meta);
  }, [token, page]);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  function openEdit(s: Service) {
    setEditing(s.id);
    setEName(s.name);
    setEDesc(s.description ?? '');
    setEPrice(s.price);
    setECur(s.currency);
    setEDur(s.duration ?? '');
    setECat(s.category ?? '');
    setEActive(s.active);
    setErr(null);
    setMsg(null);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await apiFetch('/services', {
      method: 'POST',
      token,
      json: {
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price) || 0,
        currency: currency.trim() || undefined,
        duration: duration.trim() || undefined,
        category: category.trim() || undefined,
        active,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(apiErrorMessage(data, 'Création impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Service créé.');
    setName('');
    setDescription('');
    setPrice('0');
    setIsCreateModalOpen(false);
    await refresh();
    setBusy(false);
  }

  async function submitEdit(id: string, e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await apiFetch(`/services/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      json: {
        name: eName.trim(),
        description: eDesc.trim() || undefined,
        price: Number(ePrice) || 0,
        currency: eCur.trim() || undefined,
        duration: eDur.trim() || undefined,
        category: eCat.trim() || undefined,
        active: eActive,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(apiErrorMessage(data, 'Mise à jour impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Service mis à jour.');
    setEditing(null);
    await refresh();
    setBusy(false);
  }

  async function remove(id: string) {
    if (!token || !window.confirm('Supprimer ce service ?')) {
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await apiFetch(`/services/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(apiErrorMessage(data, 'Suppression impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Service supprimé.');
    setEditing(null);
    await refresh();
    setBusy(false);
  }

  return (
    <div>
      <AdminReferentialHeader
        title="Services catalogue"
        description="Liste administrative (y compris inactifs) ; gestion via l’API services."
        actionLabel="Créer un service"
        onAction={() => setIsCreateModalOpen(true)}
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
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
        onClose={() => setIsCreateModalOpen(false)}
        title="Nouveau service"
        size="lg"
      >
        <form onSubmit={(e) => void submitCreate(e)} className="space-y-4">
          <div>
            <label className={adminLabelClass}>Nom</label>
            <input className={adminFieldClass} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Consultation médicale" />
          </div>
          <div>
            <label className={adminLabelClass}>Description</label>
            <textarea
              className={`${adminFieldClass} min-h-[4rem]`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description détaillée du service"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={adminLabelClass}>Prix</label>
              <input
                type="number"
                min={0}
                step={0.01}
                className={adminFieldClass}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={adminLabelClass}>Devise</label>
              <input className={adminFieldClass} value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="XOF" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={adminLabelClass}>Durée</label>
              <input className={adminFieldClass} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex: 30 min" />
            </div>
            <div>
              <label className={adminLabelClass}>Catégorie</label>
              <input className={adminFieldClass} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Consultation" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Visible (actif)
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Création...' : 'Créer'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={busy}
            >
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      <AdminReferentialDataCard
        listTitle="Dossiers services"
        listIcon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
        countLabel={`${rows.length} service${rows.length > 1 ? 's' : ''}`}
      >
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={adminDataTableThClass}>Prestation</th>
              <th className={`${adminDataTableThClass} hidden md:table-cell`}>Catégorie</th>
              <th className={adminDataTableThClass}>Prix</th>
              <th className={adminDataTableThClass}>Actif</th>
              <th className={adminDataTableThRightClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((s) => (
              <tr key={s.id} className="transition hover:bg-slate-50">
                <td className="max-w-[12rem] px-4 py-3 align-top text-slate-900">
                  <p className="font-semibold">{s.name}</p>
                  {s.duration ? <p className="text-xs text-slate-500">{s.duration}</p> : null}
                  {s.category ? <p className="text-xs text-slate-600 md:hidden">Cat. {s.category}</p> : null}
                  {editing === s.id ? (
                    <form
                      className="mt-3 space-y-2 rounded-lg border border-teal-200 bg-teal-50/30 p-3"
                      onSubmit={(e) => void submitEdit(s.id, e)}
                    >
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Nom</label>
                        <input className={adminFieldClass} value={eName} required onChange={(e) => setEName(e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
                        <textarea className={`${adminFieldClass} min-h-[3rem]`} value={eDesc} onChange={(e) => setEDesc(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-700">Prix</label>
                          <input type="number" className={adminFieldClass} value={ePrice} onChange={(e) => setEPrice(e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-700">Devise</label>
                          <input className={adminFieldClass} placeholder="Devise" value={eCur} onChange={(e) => setECur(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-700">Durée</label>
                          <input className={adminFieldClass} placeholder="Durée" value={eDur} onChange={(e) => setEDur(e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-700">Catégorie</label>
                          <input className={adminFieldClass} placeholder="Catégorie" value={eCat} onChange={(e) => setECat(e.target.value)} />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} />
                        Actif
                      </label>
                      <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={busy} className="flex-1">
                          {busy ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
                          Annuler
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </td>
                <td className="hidden max-w-[10rem] px-4 py-3 align-top text-slate-700 md:table-cell">
                  {s.category?.trim() ? s.category : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-900">
                  {s.price}&nbsp;{s.currency}
                </td>
                <td className="px-4 py-3 align-top">{s.active ? 'Oui' : 'Non'}</td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {editing === s.id ? (
                      <span className="text-xs italic text-slate-500">Édition en cours…</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          disabled={busy || editing !== null}
                          className={adminEditRowButtonClass}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Éditer
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(s.id)}
                          disabled={busy || editing !== null}
                          className={adminDeleteRowButtonClass}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
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
          <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun service enregistré.</p>
        ) : null}
        <div className="border-t border-slate-100 px-4 py-4">
          <Pagination meta={listMeta} disabled={busy} onPageChange={setPage} />
        </div>
      </AdminReferentialDataCard>
      </div>
    </div>
  );
}
