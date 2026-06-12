'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api/client';
import { getNetworkErrorMessage } from '@/lib/api-errors';
import { useToastFeedback } from '@/hooks/useToastFeedback';

const field =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25';

export default function ProfilPage() {
  const { token, user, replaceUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useToastFeedback(error, success);

  useEffect(() => {
    if (!user) {
      return;
    }
    queueMicrotask(() => {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhone(user.phone ?? '');
    });
  }, [user]);

  useEffect(() => {
    if (!token) return;
    queueMicrotask(async () => {
      try {
        const res = await apiFetch('/users/me', { method: 'GET', token });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        // Silently fail
      }
    });
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      const p = phone.trim();
      if (p.length > 0) {
        payload.phone = p;
      }
      const res = await apiFetch('/users/me', {
        method: 'PATCH',
        token,
        json: payload,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray((data as { message?: unknown }).message)
          ? ((data as { message: string[] }).message ?? []).join(', ')
          : typeof (data as { message?: unknown }).message === 'string'
            ? (data as { message: string }).message
            : 'Mise à jour impossible.';
        setError(msg);
        setLoading(false);
        return;
      }
      replaceUser(data as Parameters<typeof replaceUser>[0]);
      setSuccess('Identité synchronisée avec le dossier métier.');
    } catch (err) {
      setError(getNetworkErrorMessage(err));
    }
    setLoading(false);
  }

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '??';
  const roleLabel = user?.role?.replace(/_/g, ' ').toUpperCase() ?? '';

  return (
    <div className="mx-auto max-w-4xl px-4 pb-14 pt-6 lg:px-8">
      {/* Header avec avatar */}
      <div className="mb-8 flex items-center gap-6 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-6 shadow-sm">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-2xl font-bold text-white shadow-lg">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{user?.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {roleLabel}
            </span>
            {user?.active !== false && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Compte actif
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Informations du compte */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <CardTitle className="text-base font-bold text-slate-900">Informations du compte</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Identifiant
              </label>
              <p className="mt-1 font-mono text-sm text-slate-900">
                {data?.id ? `${data.id.slice(0, 8)}...` : '—'}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Adresse e-mail
              </label>
              <p className="mt-1 text-sm font-medium text-slate-900">{user?.email ?? '—'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rôle
              </label>
              <p className="mt-1 text-sm text-slate-900">{roleLabel || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Statut
              </label>
              <p className="mt-1 text-sm text-slate-900">
                {user?.active !== false ? (
                  <span className="text-green-700">✓ Compte actif</span>
                ) : (
                  <span className="text-red-700">✗ Compte inactif</span>
                )}
              </p>
            </div>
            {data?.createdAt && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Membre depuis
                </label>
                <p className="mt-1 text-sm text-slate-900">
                  {new Date(data.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modifier les informations personnelles */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <CardTitle className="text-base font-bold text-slate-900">Modifier mes informations</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Ces informations seront utilisées dans vos dossiers laboratoire
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Prénom
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={field}
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nom
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={field}
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={field}
                  placeholder="+229 XX XX XX XX"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Numéro de téléphone pour vous contacter
                </p>
              </div>
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </span>
                ) : (
                  'Enregistrer les modifications'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
