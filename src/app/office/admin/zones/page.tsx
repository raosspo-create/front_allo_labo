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
import { apiFetch } from '@/lib/api/client';
import { publicApiUrl } from '@/lib/env';

type Zone = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  active: boolean;
};

export default function AdminZonesPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Zone[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [active, setActive] = useState(true);

  const [eName, setEName] = useState('');
  const [eCode, setECode] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eActive, setEActive] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch(`${publicApiUrl()}/zones`);
    const data = await res.json().catch(() => []);
    setRows(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  function openEdit(z: Zone) {
    setEditing(z.id);
    setEName(z.name);
    setECode(z.code ?? '');
    setEDesc(z.description ?? '');
    setEActive(z.active);
    setErr(null);
    setMsg(null);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await apiFetch('/zones', {
      method: 'POST',
      token,
      json: {
        name: name.trim(),
        code: code.trim() || undefined,
        description: desc.trim() || undefined,
        active,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(apiErrorMessage(data, 'Création impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Zone créée.');
    setName('');
    setCode('');
    setDesc('');
    setIsCreateModalOpen(false);
    await refresh();
    setBusy(false);
  }

  async function submitEdit(id: string, e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    const res = await apiFetch(`/zones/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      json: {
        name: eName.trim(),
        code: eCode.trim() || undefined,
        description: eDesc.trim() || undefined,
        active: eActive,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(apiErrorMessage(data, 'Mise à jour impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Zone mise à jour.');
    setEditing(null);
    await refresh();
    setBusy(false);
  }

  async function remove(id: string) {
    if (!token || !window.confirm('Supprimer cette zone ?')) return;
    setBusy(true);
    const res = await apiFetch(`/zones/${encodeURIComponent(id)}`, { method: 'DELETE', token });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(apiErrorMessage(data, 'Suppression impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Zone supprimée.');
    setEditing(null);
    await refresh();
    setBusy(false);
  }

  return (
    <div>
      <AdminReferentialHeader
        title="Zones"
        description="Géographie et tarification — référentiel des zones géographiques."
        actionLabel="Créer une zone"
        onAction={() => setIsCreateModalOpen(true)}
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
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
        title="Nouvelle zone"
        size="md"
      >
        <form onSubmit={(e) => void submitCreate(e)} className="space-y-4">
          <div>
            <label className={adminLabelClass}>Nom</label>
            <input className={adminFieldClass} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cotonou Centre" />
          </div>
          <div>
            <label className={adminLabelClass}>Code</label>
            <input className={adminFieldClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: CTN-C" />
          </div>
          <div>
            <label className={adminLabelClass}>Description</label>
            <textarea className={`${adminFieldClass} min-h-[3rem]`} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description de la zone" />
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
        listTitle="Liste des zones"
        listIcon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        countLabel={`${rows.length} zone${rows.length > 1 ? 's' : ''}`}
      >
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={adminDataTableThClass}>Zone</th>
              <th className={`${adminDataTableThClass} hidden lg:table-cell`}>Description</th>
              <th className={adminDataTableThClass}>Actif</th>
              <th className={adminDataTableThRightClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((z) => (
              <tr key={z.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold text-slate-900">{z.name}</p>
                  {z.code ? <p className="text-xs text-slate-500">Code : {z.code}</p> : null}
                  {z.description ? <p className="mt-1 text-xs text-slate-600 lg:hidden">{z.description}</p> : null}
                  {editing === z.id ? (
                    <form
                      className="mt-3 space-y-2 rounded-lg border border-teal-200 bg-teal-50/30 p-3"
                      onSubmit={(e) => void submitEdit(z.id, e)}
                    >
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Nom</label>
                        <input className={adminFieldClass} value={eName} required onChange={(e) => setEName(e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Code</label>
                        <input className={adminFieldClass} placeholder="Code" value={eCode} onChange={(e) => setECode(e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Description</label>
                        <textarea className={`${adminFieldClass} min-h-[3rem]`} value={eDesc} onChange={(e) => setEDesc(e.target.value)} />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} />
                        Active
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
                <td className="hidden max-w-[14rem] px-4 py-3 align-top text-slate-700 lg:table-cell">
                  {z.description?.trim() ? z.description : '—'}
                </td>
                <td className="px-4 py-3 align-top text-slate-900">{z.active ? 'Oui' : 'Non'}</td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {editing === z.id ? (
                      <span className="text-xs italic text-slate-500">Édition en cours…</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(z)}
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
                          onClick={() => void remove(z.id)}
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
          <p className="px-4 py-8 text-center text-sm text-slate-500">Aucune zone enregistrée.</p>
        ) : null}
      </AdminReferentialDataCard>
      </div>
    </div>
  );
}
