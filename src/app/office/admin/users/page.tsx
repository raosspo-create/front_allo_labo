'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { adminFieldClass, adminLabelClass } from '@/components/admin/admin-form-styles';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { OrderPermissionsEditor } from '@/components/admin/OrderPermissionsEditor';
import { apiErrorMessage } from '@/lib/api-errors';
import { Pagination } from '@/components/ui/Pagination';
import { apiFetch } from '@/lib/api/client';
import {
  buildPageQuery,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
  type PaginationMeta,
} from '@/lib/pagination';
import { publicApiUrl } from '@/lib/env';
import {
  DEFAULT_ORDER_PERMISSIONS,
  type OrderPermissions,
} from '@/lib/order-permissions';
import { canManageUserAccounts, ROLE_LABELS } from '@/lib/types/auth';

const ROLES = [
  'client',
  'technicien',
  'coursier',
  'operateur',
  'super_admin',
] as const;

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  zoneId?: string | null;
  active: boolean;
  orderPermissions?: OrderPermissions;
};

type ZoneOption = {
  id: string;
  name: string;
  code?: string | null;
};

export default function AdminUsersPage() {
  const { token, user: me } = useAuth();
  const canManageUsers = canManageUserAccounts(me?.role);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [cEmail, setCEmail] = useState('');
  const [cPass, setCPass] = useState('');
  const [cFirst, setCFirst] = useState('');
  const [cLast, setCLast] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cRole, setCRole] = useState<(typeof ROLES)[number]>('client');
  const [cZoneId, setCZoneId] = useState('');
  const [cActive, setCActive] = useState(true);

  const [eEmail, setEEmail] = useState('');
  const [ePass, setEPass] = useState('');
  const [eFirst, setEFirst] = useState('');
  const [eLast, setELast] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eRole, setERole] = useState<(typeof ROLES)[number]>('client');
  const [eZoneId, setEZoneId] = useState('');
  const [eActive, setEActive] = useState(true);
  const [eOrderPerms, setEOrderPerms] = useState<OrderPermissions>({
    ...DEFAULT_ORDER_PERMISSIONS,
  });
  const [cOrderPerms, setCOrderPerms] = useState<OrderPermissions>({
    ...DEFAULT_ORDER_PERMISSIONS,
  });

  const [zones, setZones] = useState<ZoneOption[]>([]);

  const refresh = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch(
      `/users${buildPageQuery({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: debouncedSearch || undefined,
      })}`,
      { method: 'GET', token },
    );
    const data = await parsePaginatedResponse<UserRow>(res);
    setRows(data.items);
    setListMeta(data.meta);
  }, [token, page, debouncedSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const res = await fetch(`${publicApiUrl()}/zones`);
        if (!res.ok) return;
        const data = await res.json();
        setZones(
          Array.isArray(data)
            ? (data as (ZoneOption & { active?: boolean })[]).filter((z) => z.active !== false)
            : [],
        );
      } catch {
        setZones([]);
      }
    });
  }, []);

  function zoneLabel(zoneId: string | null | undefined) {
    if (!zoneId) return '—';
    const z = zones.find((x) => x.id === zoneId);
    return z ? `${z.name}${z.code ? ` (${z.code})` : ''}` : `${zoneId.slice(0, 8)}…`;
  }

  function openEdit(u: UserRow) {
    setEditing(u.id);
    setEEmail(u.email);
    setEPass('');
    setEFirst(u.firstName);
    setELast(u.lastName);
    setEPhone(u.phone ?? '');
    setERole(
      (ROLES.includes(u.role as (typeof ROLES)[number])
        ? u.role
        : 'client') as (typeof ROLES)[number],
    );
    setEActive(u.active);
    setEZoneId(u.zoneId ?? '');
    setEOrderPerms({ ...DEFAULT_ORDER_PERMISSIONS, ...u.orderPermissions });
    setErr(null);
    setMsg(null);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    const jsonBody: Record<string, unknown> = {
      email: cEmail.trim(),
      password: cPass,
      firstName: cFirst.trim(),
      lastName: cLast.trim(),
      phone: cPhone.trim() || undefined,
      role: cRole,
      active: cActive,
    };
    if (cRole === 'technicien' || cRole === 'coursier') {
      if (cZoneId.trim()) jsonBody.zoneId = cZoneId.trim();
      jsonBody.orderPermissions = cOrderPerms;
    }
    const res = await apiFetch('/users', {
      method: 'POST',
      token,
      json: jsonBody,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(apiErrorMessage(data, 'Création impossible.'));
      setBusy(false);
      return;
    }
    setMsg('Utilisateur créé.');
    setCEmail('');
    setCPass('');
    setCFirst('');
    setCLast('');
    setCPhone('');
    setCZoneId('');
    setCOrderPerms({ ...DEFAULT_ORDER_PERMISSIONS });
    setShowCreateForm(false);
    await refresh();
    setBusy(false);
  }

  async function submitEdit(id: string, e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErr(null);
    const patch: Record<string, unknown> = {
      email: eEmail.trim(),
      firstName: eFirst.trim(),
      lastName: eLast.trim(),
      role: eRole,
      active: eActive,
    };
    if (ePhone.trim()) {
      patch.phone = ePhone.trim();
    }
    if (ePass.trim().length >= 8) {
      patch.password = ePass.trim();
    }
    if (eRole === 'technicien' || eRole === 'coursier') {
      patch.zoneId = eZoneId.trim() || null;
      patch.orderPermissions = eOrderPerms;
    }
    const res = await apiFetch(`/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      json: patch,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(apiErrorMessage(data, 'Mise à jour impossible.'));
      setBusy(false);
      return;
    }
    setEditing(null);
    setMsg('Utilisateur mis à jour.');
    await refresh();
    setBusy(false);
  }

  async function remove(id: string) {
    if (!token || !window.confirm('Supprimer cet utilisateur ?')) return;
    if (me?.id === id) {
      setErr('Vous ne pouvez pas vous supprimer.');
      return;
    }
    setBusy(true);
    const res = await apiFetch(`/users/${encodeURIComponent(id)}`, { method: 'DELETE', token });
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
      <div className="border-b border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestion des Utilisateurs</h1>
                <p className="mt-0.5 text-sm text-slate-600">
                  {canManageUsers
                    ? 'Gérez les comptes utilisateurs et leurs permissions'
                    : 'Consultation des comptes (modification réservée au super administrateur)'}
                </p>
              </div>
            </div>
            {canManageUsers ? (
              <Button type="button" onClick={() => setShowCreateForm(true)}>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Créer un utilisateur
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 lg:px-8">
        {err && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <svg className="h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-red-900">Erreur</p>
              <p className="mt-0.5 text-sm text-red-800">{err}</p>
            </div>
            <button onClick={() => setErr(null)} className="text-red-400 hover:text-red-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {msg && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-teal-200 bg-teal-50 p-4">
            <svg className="h-5 w-5 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-teal-900">Succès</p>
              <p className="mt-0.5 text-sm text-teal-800">{msg}</p>
            </div>
            <button onClick={() => setMsg(null)} className="text-teal-400 hover:text-teal-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Nouveau compte utilisateur"
        size="lg"
      >
        <form onSubmit={(e) => void submitCreate(e)} className="space-y-4">
          <div>
            <label className={adminLabelClass}>E-mail</label>
            <input 
              type="email" 
              className={adminFieldClass} 
              required 
              value={cEmail} 
              onChange={(e) => setCEmail(e.target.value)} 
              placeholder="utilisateur@example.com"
            />
          </div>
          <div>
            <label className={adminLabelClass}>Mot de passe</label>
            <input 
              type="password" 
              className={adminFieldClass} 
              required 
              minLength={8} 
              value={cPass} 
              onChange={(e) => setCPass(e.target.value)} 
              placeholder="Minimum 8 caractères"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={adminLabelClass}>Prénom</label>
              <input 
                className={adminFieldClass} 
                required 
                value={cFirst} 
                onChange={(e) => setCFirst(e.target.value)} 
                placeholder="Prénom"
              />
            </div>
            <div>
              <label className={adminLabelClass}>Nom</label>
              <input 
                className={adminFieldClass} 
                required 
                value={cLast} 
                onChange={(e) => setCLast(e.target.value)} 
                placeholder="Nom"
              />
            </div>
          </div>
          <div>
            <label className={adminLabelClass}>Téléphone</label>
            <input 
              className={adminFieldClass} 
              placeholder="+229 XX XX XX XX" 
              value={cPhone} 
              onChange={(e) => setCPhone(e.target.value)} 
            />
          </div>
          <div>
            <label className={adminLabelClass}>Rôle</label>
            <select
              className={adminFieldClass}
              value={cRole}
              onChange={(e) => {
                const r = e.target.value as (typeof ROLES)[number];
                setCRole(r);
                if (r !== 'technicien' && r !== 'coursier') setCZoneId('');
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          {(cRole === 'technicien' || cRole === 'coursier') && (
            <>
              <div>
                <label className={adminLabelClass}>Zone d’activité (optionnel)</label>
                <select className={adminFieldClass} value={cZoneId} onChange={(e) => setCZoneId(e.target.value)}>
                  <option value="">— Aucune —</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                      {z.code ? ` (${z.code})` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Utilisée comme zone de départ des trajets lorsque ce collaborateur est assigné à une commande.
                </p>
              </div>
              <OrderPermissionsEditor
                value={cOrderPerms}
                onChange={setCOrderPerms}
                disabled={busy}
              />
            </>
          )}
          <label className="flex gap-2 text-sm">
            <input type="checkbox" checked={cActive} onChange={(e) => setCActive(e.target.checked)} /> Actif
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Création...' : 'Créer'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateForm(false)}
              disabled={busy}
            >
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Annuaire
              <span className="ml-auto text-sm font-normal text-slate-500">
                ({listMeta.total} utilisateur{listMeta.total > 1 ? 's' : ''})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="!px-0">
            <div className="border-b border-slate-100 px-4 py-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, e-mail, téléphone…"
                className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Rôle</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Zone activité</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.map((u) => (
                    <tr key={u.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-sm font-bold text-white shadow">
                            {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                        {editing === u.id && (
                          <form className="mt-3 space-y-2 rounded-lg border border-teal-200 bg-teal-50/30 p-3" onSubmit={(e) => void submitEdit(u.id, e)}>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-700">Prénom</label>
                                <input className={adminFieldClass} required value={eFirst} onChange={(e) => setEFirst(e.target.value)} />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-700">Nom</label>
                                <input className={adminFieldClass} required value={eLast} onChange={(e) => setELast(e.target.value)} />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">E-mail</label>
                              <input className={adminFieldClass} type="email" required value={eEmail} onChange={(e) => setEEmail(e.target.value)} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">Téléphone</label>
                              <input className={adminFieldClass} placeholder="Téléphone" value={ePhone} onChange={(e) => setEPhone(e.target.value)} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">Nouveau mot de passe (optionnel)</label>
                              <input className={adminFieldClass} type="password" placeholder="Minimum 8 caractères" value={ePass} onChange={(e) => setEPass(e.target.value)} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">Rôle</label>
                              <select
                                className={adminFieldClass}
                                value={eRole}
                                onChange={(e) => {
                                  const r = e.target.value as (typeof ROLES)[number];
                                  setERole(r);
                                  if (r !== 'technicien' && r !== 'coursier') setEZoneId('');
                                }}
                              >
                                {ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {(eRole === 'technicien' || eRole === 'coursier') && (
                              <>
                                <div>
                                  <label className="mb-1 block text-xs font-medium text-slate-700">
                                    Zone d’activité (optionnel)
                                  </label>
                                  <select
                                    className={adminFieldClass}
                                    value={eZoneId}
                                    onChange={(e) => setEZoneId(e.target.value)}
                                  >
                                    <option value="">— Aucune —</option>
                                    {zones.map((z) => (
                                      <option key={z.id} value={z.id}>
                                        {z.name}
                                        {z.code ? ` (${z.code})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <OrderPermissionsEditor
                                  value={eOrderPerms}
                                  onChange={setEOrderPerms}
                                  disabled={busy}
                                />
                              </>
                            )}
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-600" checked={eActive} onChange={(e) => setEActive(e.target.checked)} />
                              Compte actif
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
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-900">{u.phone || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'operateur'
                            ? 'bg-teal-100 text-teal-800'
                            : u.role === 'technicien'
                            ? 'bg-blue-100 text-blue-800'
                            : u.role === 'coursier'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {u.role === 'super_admin' && (
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                          )}
                          {u.role === 'technicien' && (
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                              <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                            </svg>
                          )}
                          {u.role === 'coursier' && (
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                            </svg>
                          )}
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700">
                          {u.role === 'technicien' || u.role === 'coursier' ? zoneLabel(u.zoneId) : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          {u.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {editing === u.id ? (
                            <span className="text-xs italic text-slate-500">Édition en cours...</span>
                          ) : canManageUsers ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(u)}
                                disabled={busy || editing !== null}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Éditer cet utilisateur"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Éditer
                              </button>
                              <button
                                type="button"
                                onClick={() => void remove(u.id)}
                                disabled={busy || editing !== null || me?.id === u.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                title={me?.id === u.id ? 'Vous ne pouvez pas vous supprimer' : 'Supprimer cet utilisateur'}
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Supprimer
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">Lecture seule</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-4 py-4">
              <Pagination meta={listMeta} disabled={busy} onPageChange={setPage} />
            </div>
          </CardContent>
      </Card>
      </div>
    </div>
  );
}
