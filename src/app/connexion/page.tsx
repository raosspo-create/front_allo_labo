'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { resolvePostLoginPath } from '@/lib/auth-redirect';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api/client';
import { getNetworkErrorMessage } from '@/lib/api-errors';
import { AlloLaboLogo } from '@/components/brand/AlloLaboLogo';
import { useToastFeedback } from '@/hooks/useToastFeedback';

const field =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25';

export default function ConnexionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useToastFeedback(error);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        json: { email, password },
      });
      const data = (await res.json().catch(() => ({}))) as {
        accessToken?: string;
        user?: Parameters<typeof loginWithToken>[1];
        message?: string | string[];
      };
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : typeof data.message === 'string'
            ? data.message
            : 'Connexion impossible';
        setError(msg);
        setLoading(false);
        return;
      }
      if (data.accessToken && data.user) {
        loginWithToken(data.accessToken, data.user);
        router.push(resolvePostLoginPath(searchParams.get('next')));
        router.refresh();
        return;
      }
      setError('Réponse inattendue du serveur');
    } catch (err) {
      setError(getNetworkErrorMessage(err));
    }
    setLoading(false);
  }

  return (
    <div className="grid min-h-[60vh] flex-1 lg:min-h-[70vh] lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 p-12 text-white lg:flex">
        <div>
          <AlloLaboLogo size={72} className="mb-10" imageClassName="drop-shadow-md" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300/90">
            Console sécurisée
          </p>
          <h2 className="mt-8 max-w-sm text-3xl font-bold leading-tight tracking-tight">
            Accès à vos commandes et à votre dossier laboratoire
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-300">
            Prenez rendez-vous avec des médecins locaux qui acceptent votre assurance.
          </p>
        </div>
        <p className="text-xs text-slate-500">Allo-Labo — usage strictement habilité</p>
      </div>

      <div className="flex items-center justify-center px-4 py-14 sm:px-8">
        <Card className="w-full max-w-md shadow-[0_20px_50px_-20px_rgba(15,23,42,0.2)]">
          <CardHeader>
            <CardTitle className="text-xl">Connexion</CardTitle>
            <CardDescription>
              Pas encore de compte ?{' '}
              <Link href="/inscription" className="font-semibold text-teal-800 hover:text-teal-900">
                Créer un accès
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Adresse e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Mot de passe
                  </label>
                  <Link
                    href="/mot-de-passe-oublie"
                    className="text-xs font-semibold text-teal-800 hover:text-teal-900"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={field}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Ouverture de session…' : 'Continuer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
