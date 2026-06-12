'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api/client';
import { getNetworkErrorMessage } from '@/lib/api-errors';
import { useToastFeedback } from '@/hooks/useToastFeedback';

const field =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useToastFeedback(error, success);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        json: { email: email.trim() },
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string | string[];
      };
      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : typeof data.message === 'string'
            ? data.message
            : 'Demande impossible';
        setError(msg);
        setLoading(false);
        return;
      }
      setSuccess(
        typeof data.message === 'string'
          ? data.message
          : 'Si un compte actif existe pour cette adresse, un e-mail de réinitialisation a été envoyé.',
      );
    } catch (err) {
      setError(getNetworkErrorMessage(err));
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-14 sm:px-8">
      <Card className="w-full max-w-md shadow-[0_20px_50px_-20px_rgba(15,23,42,0.2)]">
        <CardHeader>
          <CardTitle className="text-xl">Mot de passe oublié</CardTitle>
          <CardDescription>
            Saisissez l’adresse e-mail de votre compte. Nous vous enverrons un lien pour choisir un
            nouveau mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-5">
              <p className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-relaxed text-teal-900">
                {success}
              </p>
              <p className="text-sm text-slate-600">
                Vérifiez votre boîte de réception et vos courriers indésirables. Le lien expire après
                une heure.
              </p>
              <Link
                href="/connexion"
                className="inline-flex text-sm font-semibold text-teal-800 hover:text-teal-900"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
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
    </div>
  );
}
