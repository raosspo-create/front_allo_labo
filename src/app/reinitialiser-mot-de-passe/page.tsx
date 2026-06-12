'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api/client';
import { getNetworkErrorMessage } from '@/lib/api-errors';
import { useToastFeedback } from '@/hooks/useToastFeedback';

const field =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useToastFeedback(error, success);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Lien invalide. Demandez une nouvelle réinitialisation.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        json: { token, password },
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string | string[];
      };
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : typeof data.message === 'string'
            ? data.message
            : 'Réinitialisation impossible';
        setError(msg);
        setLoading(false);
        return;
      }
      setSuccess(
        typeof data.message === 'string'
          ? data.message
          : 'Mot de passe mis à jour. Vous pouvez vous connecter.',
      );
      setTimeout(() => router.push('/connexion'), 2500);
    } catch (err) {
      setError(getNetworkErrorMessage(err));
    }
    setLoading(false);
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md shadow-[0_20px_50px_-20px_rgba(15,23,42,0.2)]">
        <CardHeader>
          <CardTitle className="text-xl">Lien invalide</CardTitle>
          <CardDescription>
            Ce lien de réinitialisation est incomplet ou a déjà été utilisé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link
            href="/mot-de-passe-oublie"
            className="inline-flex text-sm font-semibold text-teal-800 hover:text-teal-900"
          >
            Demander un nouveau lien
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-[0_20px_50px_-20px_rgba(15,23,42,0.2)]">
      <CardHeader>
        <CardTitle className="text-xl">Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un mot de passe d’au moins 8 caractères pour votre compte Allo-Labo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-relaxed text-teal-900">
              {success}
            </p>
            <p className="text-sm text-slate-600">Redirection vers la connexion…</p>
            <Link
              href="/connexion"
              className="inline-flex text-sm font-semibold text-teal-800 hover:text-teal-900"
            >
              Se connecter maintenant
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={field}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
            </Button>
            <p className="text-center text-sm text-slate-600">
              <Link href="/connexion" className="font-semibold text-teal-800 hover:text-teal-900">
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-14 sm:px-8">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardContent className="py-10 text-center text-sm text-slate-500">
              Chargement…
            </CardContent>
          </Card>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
