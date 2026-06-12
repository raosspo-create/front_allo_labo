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

type Frais = {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  amount: string;
  currency: string;
  active: boolean;
};

export default function AdminFraisPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Frais[]>([]);
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

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('0');
  const [currency, setCurrency] = useState('XOF');
  const [active, setActive] = useState(true);

  const [eCode, setECode] = useState('');
  const [eName, setEName] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eAmount, setEAmount] = useState('');
  const [eCur, setECur] = useState('XOF');
  const [eActive, setEActive] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch(
      `/frais-supplementaires/admin${buildPageQuery({ page, limit: DEFAULT_PAGE_SIZE })}`,
      { method: 'GET', token },
    );
    const data = await parsePaginatedResponse<Frais>(res);
    setRows(data.items);
    setListMeta(data.meta);
  }, [token, page]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  function openEdit(f: Frais) {
    setEditing(f.id);
    setECode(f.code ?? '');
    setEName(f.name);
    setEDesc(f.description ?? '');
    setEAmount(f.amount);
    setECur(f.currency);
    setEActive(f.active);
    setErr(null);
    setMsg(null);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    const res = await apiFetch('/frais-supplementaires', {
      method: 'POST',
      token,
      json: {
        code: code.trim() || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        amount: Number(amount) || 0,
        currency: currency.trim() || undefined,
        active,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(apiErrorMessage(data, 'Création impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Frais créé.');
    setName('');
    setCode('');
    setDescription('');
    setAmount('0');
    setIsCreateModalOpen(false);
    await refresh();
    setBusy(false);
  }

  async function submitEdit(id: string, e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    const res = await apiFetch(`/frais-supplementaires/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      json: {
        code: eCode.trim() || undefined,
        name: eName.trim(),
        description: eDesc.trim() || undefined,
        amount: Number(eAmount) || 0,
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
    setMsg('Mis à jour.');
    await refresh();
    setBusy(false);
  }

  async function remove(id: string) {
    if (!token || !window.confirm('Supprimer ce frais ?')) return;
    setBusy(true);
    const res = await apiFetch(`/frais-supplementaires/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(apiErrorMessage(data, 'Suppression impossible.'));
      setBusy(false);
      return;
    }
    setEditing(null);
    await refresh();
    setBusy(false);
  }

  return (
    <div>
      <AdminReferentialHeader
        title="Frais supplémentaires"
        description="Référentiel des frais optionnels facturables en complément des prestations."
        actionLabel="Créer un frais"
        onAction={() => setIsCreateModalOpen(true)}
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

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nouveau frais supplémentaire"
        size="md"
      >
        <form onSubmit={(e) => void submitCreate(e)} className="space-y-4">
          <div>
            <label className={adminLabelClass}>Code</label>
            <input className={adminFieldClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: DEPLAC" />
          </div>
          <div>
            <label className={adminLabelClass}>Libellé</label>
            <input className={adminFieldClass} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Frais de déplacement" />
          </div>
          <div>
            <label className={adminLabelClass}>Description</label>
            <textarea className={`${adminFieldClass} min-h-[2.5rem]`} placeholder="Description du frais" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={adminLabelClass}>Montant</label>
              <input type="number" min={0} step={0.01} className={adminFieldClass} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={adminLabelClass}>Devise</label>
              <input className={adminFieldClass} value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="XOF" />
            </div>
          </div>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Actif
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
        listTitle="Tarifs et frais"
        listIcon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        }
        countLabel={`${rows.length} frais`}
      >
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={adminDataTableThClass}>Libellé</th>
              <th className={adminDataTableThClass}>Montant</th>
              <th className={adminDataTableThClass}>Actif</th>
              <th className={adminDataTableThRightClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((f) => (
              <tr key={f.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold text-slate-900">{f.name}</p>
                  <p className="text-xs text-slate-500">Code : {f.code ?? '—'}</p>
                  {editing === f.id ? (
                    <form
                      className="mt-3 space-y-2 rounded-lg border border-teal-200 bg-teal-50/30 p-3"
                      onSubmit={(e) => void submitEdit(f.id, e)}
                    >
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Code</label>
                        <input className={adminFieldClass} value={eCode} onChange={(e) => setECode(e.target.value)} placeholder="Code" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Libellé</label>
                        <input className={adminFieldClass} required value={eName} onChange={(e) => setEName(e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
                        <textarea className={`${adminFieldClass} min-h-[2.5rem]`} value={eDesc} onChange={(e) => setEDesc(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-700">Montant</label>
                          <input type="number" className={adminFieldClass} value={eAmount} onChange={(e) => setEAmount(e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-700">Devise</label>
                          <input className={adminFieldClass} value={eCur} onChange={(e) => setECur(e.target.value)} />
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
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-900">
                  {f.amount}&nbsp;{f.currency}
                </td>
                <td className="px-4 py-3 align-top">{f.active ? 'Oui' : 'Non'}</td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {editing === f.id ? (
                      <span className="text-xs italic text-slate-500">Édition en cours…</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(f)}
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
                          onClick={() => void remove(f.id)}
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
          <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun frais enregistré.</p>
        ) : null}
        <div className="border-t border-slate-100 px-4 py-4">
          <Pagination meta={listMeta} disabled={busy} onPageChange={setPage} />
        </div>
      </AdminReferentialDataCard>
      </div>
    </div>
  );
}
