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

type Analyse = {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  patientInstructions?: string | null;
  active: boolean;
};

export default function AdminAnalysesPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Analyse[]>([]);
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
  const [category, setCategory] = useState('');
  const [patientInstructions, setPatientInstructions] = useState('');
  const [active, setActive] = useState(true);

  const [eCode, setECode] = useState('');
  const [eName, setEName] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eCat, setECat] = useState('');
  const [ePat, setEPat] = useState('');
  const [eActive, setEActive] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch(
      `/analyses/admin${buildPageQuery({ page, limit: DEFAULT_PAGE_SIZE })}`,
      { method: 'GET', token },
    );
    const data = await parsePaginatedResponse<Analyse>(res);
    setRows(data.items);
    setListMeta(data.meta);
  }, [token, page]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  function openEdit(a: Analyse) {
    setEditing(a.id);
    setECode(a.code ?? '');
    setEName(a.name);
    setEDesc(a.description ?? '');
    setECat(a.category ?? '');
    setEPat(a.patientInstructions ?? '');
    setEActive(a.active);
    setErr(null);
    setMsg(null);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await apiFetch('/analyses', {
      method: 'POST',
      token,
      json: {
        code: code.trim() || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        patientInstructions: patientInstructions.trim() || undefined,
        active,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(apiErrorMessage(data, 'Création impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Analyse créée.');
    setCode('');
    setName('');
    setDescription('');
    setCategory('');
    setPatientInstructions('');
    setIsCreateModalOpen(false);
    await refresh();
    setBusy(false);
  }

  async function submitEdit(id: string, e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    const res = await apiFetch(`/analyses/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      json: {
        code: eCode.trim() || undefined,
        name: eName.trim(),
        description: eDesc.trim() || undefined,
        category: eCat.trim() || undefined,
        patientInstructions: ePat.trim() || undefined,
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
    setMsg('Analyse mise à jour.');
    await refresh();
    setBusy(false);
  }

  async function remove(id: string) {
    if (!token || !window.confirm('Supprimer cette analyse ?')) return;
    setBusy(true);
    const res = await apiFetch(`/analyses/${encodeURIComponent(id)}`, { method: 'DELETE', token });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(apiErrorMessage(data, 'Suppression impossible.'));
      setBusy(false);
      return;
    }
    setEditing(null);
    setMsg('Analyse supprimée.');
    await refresh();
    setBusy(false);
  }

  return (
    <div>
      <AdminReferentialHeader
        title="Analyses"
        description="Référentiel des bilans — analyses disponibles et instructions patient."
        actionLabel="Créer une analyse"
        onAction={() => setIsCreateModalOpen(true)}
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
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
        title="Nouvelle analyse"
        size="lg"
      >
        <form onSubmit={(e) => void submitCreate(e)} className="space-y-4">
          <div>
            <label className={adminLabelClass}>Code</label>
            <input className={adminFieldClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: HEM001" />
          </div>
          <div>
            <label className={adminLabelClass}>Nom</label>
            <input className={adminFieldClass} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Hémogramme complet" />
          </div>
          <div>
            <label className={adminLabelClass}>Description</label>
            <textarea className={`${adminFieldClass} min-h-[3rem]`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description détaillée de l'analyse" />
          </div>
          <div>
            <label className={adminLabelClass}>Catégorie</label>
            <input className={adminFieldClass} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Hématologie" />
          </div>
          <div>
            <label className={adminLabelClass}>Instructions patient</label>
            <textarea className={`${adminFieldClass} min-h-[3rem]`} value={patientInstructions} onChange={(e) => setPatientInstructions(e.target.value)} placeholder="Instructions à suivre avant l'analyse" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
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
        listTitle="Répertoire des analyses"
        listIcon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        }
        countLabel={`${rows.length} analyse${rows.length > 1 ? 's' : ''}`}
      >
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={adminDataTableThClass}>Analyse</th>
              <th className={`${adminDataTableThClass} hidden md:table-cell`}>Catégorie</th>
              <th className={adminDataTableThClass}>Actif</th>
              <th className={adminDataTableThRightClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((a) => (
              <tr key={a.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold text-slate-900">{a.name}</p>
                  <p className="text-xs text-slate-500">Code : {a.code ?? '—'}</p>
                  {a.category ? <p className="text-xs text-slate-600 md:hidden">Cat. {a.category}</p> : null}
                  {editing === a.id ? (
                    <form
                      className="mt-3 space-y-2 rounded-lg border border-teal-200 bg-teal-50/30 p-3"
                      onSubmit={(e) => void submitEdit(a.id, e)}
                    >
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Code</label>
                        <input className={adminFieldClass} value={eCode} onChange={(e) => setECode(e.target.value)} placeholder="Code" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Nom</label>
                        <input className={adminFieldClass} required value={eName} onChange={(e) => setEName(e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
                        <textarea className={`${adminFieldClass} min-h-[3rem]`} value={eDesc} onChange={(e) => setEDesc(e.target.value)} placeholder="Description" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Catégorie</label>
                        <input className={adminFieldClass} value={eCat} onChange={(e) => setECat(e.target.value)} placeholder="Catégorie" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Instructions patient</label>
                        <textarea className={`${adminFieldClass} min-h-[3rem]`} value={ePat} onChange={(e) => setEPat(e.target.value)} placeholder="Instructions" />
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
                <td className="hidden max-w-[12rem] px-4 py-3 align-top text-slate-700 md:table-cell">
                  {a.category?.trim() ? a.category : '—'}
                </td>
                <td className="px-4 py-3 align-top">{a.active ? 'Oui' : 'Non'}</td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {editing === a.id ? (
                      <span className="text-xs italic text-slate-500">Édition en cours…</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
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
                          onClick={() => void remove(a.id)}
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
          <p className="px-4 py-8 text-center text-sm text-slate-500">Aucune analyse enregistrée.</p>
        ) : null}
        <div className="border-t border-slate-100 px-4 py-4">
          <Pagination meta={listMeta} disabled={busy} onPageChange={setPage} />
        </div>
      </AdminReferentialDataCard>
      </div>
    </div>
  );
}
