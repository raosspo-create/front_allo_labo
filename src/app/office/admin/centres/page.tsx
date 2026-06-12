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

type Centre = {
  id: string;
  siteName: string;
  address?: string | null;
  phone?: string | null;
  zoneId?: string | null;
  zone?: { id: string; name: string; code?: string | null } | null;
};

type Zone = { id: string; name: string; code?: string | null };

export default function AdminCentresPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Centre[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [createSite, setCreateSite] = useState('');
  const [createAddr, setCreateAddr] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createZoneId, setCreateZoneId] = useState('');

  const [editSite, setEditSite] = useState('');
  const [editAddr, setEditAddr] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editZoneId, setEditZoneId] = useState('');

  const refresh = useCallback(async () => {
    const [resCentres, resZones] = await Promise.all([
      fetch(`${publicApiUrl()}/centres`),
      fetch(`${publicApiUrl()}/zones`),
    ]);
    const data = await resCentres.json().catch(() => []);
    const dataZones = await resZones.json().catch(() => []);
    setRows(Array.isArray(data) ? data : []);
    setZones(Array.isArray(dataZones) ? dataZones.filter((z: Zone) => (z as { active?: boolean }).active !== false) : []);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  function startEdit(c: Centre) {
    setEditing(c.id);
    setEditSite(c.siteName);
    setEditAddr(c.address ?? '');
    setEditPhone(c.phone ?? '');
    setEditZoneId(c.zoneId ?? c.zone?.id ?? '');
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
    const res = await apiFetch('/centres', {
      method: 'POST',
      token,
      json: {
        siteName: createSite.trim(),
        address: createAddr.trim() || undefined,
        phone: createPhone.trim() || undefined,
        zoneId: createZoneId || undefined,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(apiErrorMessage(data, 'Création impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Centre créé.');
    setCreateSite('');
    setCreateAddr('');
    setCreatePhone('');
    setCreateZoneId('');
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
    const res = await apiFetch(`/centres/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      json: {
        siteName: editSite.trim(),
        address: editAddr.trim() || undefined,
        phone: editPhone.trim() || undefined,
        zoneId: editZoneId || null,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(apiErrorMessage(data, 'Mise à jour impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Centre mis à jour.');
    setEditing(null);
    await refresh();
    setBusy(false);
  }

  async function remove(id: string) {
    if (!token || !window.confirm('Supprimer ce centre ?')) {
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await apiFetch(`/centres/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(apiErrorMessage(data, 'Suppression impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Centre supprimé.');
    setEditing(null);
    await refresh();
    setBusy(false);
  }

  return (
    <div>
      <AdminReferentialHeader
        title="Centres"
        description="Lieux de prélèvement et laboratoires partenaires."
        actionLabel="Créer un centre"
        onAction={() => setIsCreateModalOpen(true)}
        icon={
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 21h18M5 21V7l8-4v18M19 21V10l-6-3M9 9v.01M9 12v.01M9 15v.01M9 18v.01"
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
        title="Nouveau centre"
        size="md"
      >
        <form onSubmit={(e) => void submitCreate(e)} className="space-y-4">
          <div>
            <label className={adminLabelClass}>Nom du site</label>
            <input
              className={adminFieldClass}
              required
              value={createSite}
              onChange={(e) => setCreateSite(e.target.value)}
              placeholder="Ex: Centre médical de Cotonou"
            />
          </div>
          <div>
            <label className={adminLabelClass}>Adresse</label>
            <input
              className={adminFieldClass}
              value={createAddr}
              onChange={(e) => setCreateAddr(e.target.value)}
              placeholder="Ex: Rue 123, Cotonou"
            />
          </div>
          <div>
            <label className={adminLabelClass}>Téléphone</label>
            <input
              className={adminFieldClass}
              value={createPhone}
              onChange={(e) => setCreatePhone(e.target.value)}
              placeholder="Ex: +229 XX XX XX XX"
            />
          </div>
          <div>
            <label className={adminLabelClass}>Zone géographique</label>
            <select
              className={adminFieldClass}
              value={createZoneId}
              onChange={(e) => setCreateZoneId(e.target.value)}
            >
              <option value="">— Non renseignée —</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} {z.code ? `(${z.code})` : ''}
                </option>
              ))}
            </select>
          </div>
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
        listTitle="Annuaire des centres"
        listIcon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        }
        countLabel={`${rows.length} centre${rows.length > 1 ? 's' : ''}`}
      >
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={adminDataTableThClass}>Site</th>
              <th className={`${adminDataTableThClass} hidden md:table-cell`}>Adresse</th>
              <th className={`${adminDataTableThClass} hidden sm:table-cell`}>Téléphone</th>
              <th className={`${adminDataTableThClass} hidden lg:table-cell`}>Zone</th>
              <th className={adminDataTableThRightClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((c) => (
              <tr key={c.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold text-slate-900">{c.siteName}</p>
                  <p className="text-xs text-slate-500 md:hidden">{c.phone || '—'}</p>
                  {editing === c.id ? (
                    <form
                      className="mt-3 space-y-2 rounded-lg border border-teal-200 bg-teal-50/30 p-3"
                      onSubmit={(e) => void submitEdit(c.id, e)}
                    >
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Nom du site</label>
                        <input
                          className={adminFieldClass}
                          value={editSite}
                          required
                          onChange={(e) => setEditSite(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Adresse</label>
                        <input
                          className={adminFieldClass}
                          placeholder="Adresse"
                          value={editAddr}
                          onChange={(e) => setEditAddr(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Téléphone</label>
                        <input
                          className={adminFieldClass}
                          placeholder="Téléphone"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Zone</label>
                        <select
                          className={adminFieldClass}
                          value={editZoneId}
                          onChange={(e) => setEditZoneId(e.target.value)}
                        >
                          <option value="">— Non renseignée —</option>
                          {zones.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.name} {z.code ? `(${z.code})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
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
                <td className="hidden max-w-[14rem] px-4 py-3 align-top text-slate-700 md:table-cell">
                  {c.address ?? '—'}
                </td>
                <td className="hidden px-4 py-3 align-top text-slate-900 sm:table-cell">{c.phone || '—'}</td>
                <td className="hidden px-4 py-3 align-top text-slate-700 lg:table-cell">
                  {c.zone?.name ?? '—'}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {editing === c.id ? (
                      <span className="text-xs italic text-slate-500">Édition en cours…</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
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
                          onClick={() => void remove(c.id)}
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
          <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun centre enregistré.</p>
        ) : null}
      </AdminReferentialDataCard>
      </div>
    </div>
  );
}
