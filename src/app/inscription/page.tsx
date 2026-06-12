'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useId, useState } from 'react';
import { useAuth } from '@/app/providers';
import { resolvePostLoginPath } from '@/lib/auth-redirect';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiFetch } from '@/lib/api/client';
import { getNetworkErrorMessage } from '@/lib/api-errors';
import { LegalAcceptanceField } from '@/components/legal/LegalAcceptanceField';
import { PRIVACY_POLICY_PATH } from '@/lib/legal';
import { useToastFeedback } from '@/hooks/useToastFeedback';
import {
  maxBirthDateForRegistration,
  MIN_REGISTRATION_AGE_YEARS,
  validateRegisterField,
  validateRegisterForm,
  type RegisterField,
  type RegisterFieldErrors,
} from '@/lib/register-validation';

const fieldBase =
  'mt-0.5 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2';

function fieldClass(invalid: boolean) {
  return invalid
    ? `${fieldBase} border-red-400 focus:border-red-500 focus:ring-red-500/25`
    : `${fieldBase} border-slate-300 focus:border-teal-500 focus:ring-teal-500/25`;
}

const label = 'text-xs font-medium text-slate-700';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-[11px] leading-snug text-red-600">
      {message}
    </p>
  );
}

function PasswordField({
  id,
  labelText,
  value,
  onChange,
  onBlur,
  autoComplete,
  visible,
  onToggle,
  error,
  errorId,
}: {
  id: string;
  labelText: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  autoComplete: string;
  visible: boolean;
  onToggle: () => void;
  error?: string;
  errorId: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {labelText}
      </label>
      <div className="relative mt-0.5">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`${fieldClass(Boolean(error))} pr-10`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600"
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          tabIndex={-1}
        >
          {visible ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function InscriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();
  const formId = useId();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const maxBirthDate = maxBirthDateForRegistration();

  useToastFeedback(error);

  const formValues = {
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    password,
    confirmPassword,
  };

  function clearFieldError(field: RegisterField) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function touchField(field: RegisterField) {
    const message = validateRegisterField(field, formValues);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  }

  function touchRelatedPasswordFields(changed: 'password' | 'confirmPassword') {
    const fields: RegisterField[] =
      changed === 'password' ? ['password', 'confirmPassword'] : ['confirmPassword'];
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const field of fields) {
        const message = validateRegisterField(field, formValues);
        if (message) next[field] = message;
        else delete next[field];
      }
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validateRegisterForm(formValues);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Corrigez les champs signalés avant de continuer.');
      return;
    }

    if (!acceptedTerms) {
      setTermsError('Vous devez accepter les conditions d’utilisation et la politique de confidentialité.');
      setError('Acceptez les conditions pour créer votre compte.');
      return;
    }
    setTermsError(null);

    setLoading(true);
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        json: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          dateOfBirth,
          password,
        },
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
            : 'Inscription impossible';
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
    <div className="grid min-h-0 flex-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-teal-800 via-slate-900 to-slate-950 p-10 text-white lg:flex">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200/90">
            Onboarding patient
          </p>
          <h2 className="mt-6 max-w-sm text-2xl font-bold leading-tight tracking-tight">
            Un compte pour centraliser vos demandes et suivre les étapes
          </h2>
          <ul className="mt-8 space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-teal-400">—</span> Tableau des commandes en temps quasi réel
            </li>
            <li className="flex gap-2">
              <span className="text-teal-400">—</span> Contact laboratoire cohérent avec le dossier métier
            </li>
          </ul>
        </div>
        <p className="text-xs text-slate-500">
          Données traitées conformément à notre{' '}
          <Link href={PRIVACY_POLICY_PATH} className="text-teal-300 hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-8 sm:px-6 lg:py-10">
        <Card className="w-full max-w-lg shadow-[0_20px_50px_-20px_rgba(15,23,42,0.2)]">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-lg">Créer un accès client</CardTitle>
            <CardDescription className="text-sm">
              Déjà inscrit ?{' '}
              <Link href="/connexion" className="font-semibold text-teal-800 hover:text-teal-900">
                Connexion
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form id={formId} onSubmit={onSubmit} className="space-y-3" noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${formId}-firstName`} className={label}>
                    Prénom
                  </label>
                  <input
                    id={`${formId}-firstName`}
                    type="text"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      clearFieldError('firstName');
                    }}
                    onBlur={() => touchField('firstName')}
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    aria-describedby={fieldErrors.firstName ? `${formId}-firstName-error` : undefined}
                    className={fieldClass(Boolean(fieldErrors.firstName))}
                  />
                  <FieldError id={`${formId}-firstName-error`} message={fieldErrors.firstName} />
                </div>
                <div>
                  <label htmlFor={`${formId}-lastName`} className={label}>
                    Nom
                  </label>
                  <input
                    id={`${formId}-lastName`}
                    type="text"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      clearFieldError('lastName');
                    }}
                    onBlur={() => touchField('lastName')}
                    aria-invalid={Boolean(fieldErrors.lastName)}
                    aria-describedby={fieldErrors.lastName ? `${formId}-lastName-error` : undefined}
                    className={fieldClass(Boolean(fieldErrors.lastName))}
                  />
                  <FieldError id={`${formId}-lastName-error`} message={fieldErrors.lastName} />
                </div>
              </div>

              <div>
                <label htmlFor={`${formId}-email`} className={label}>
                  E-mail
                </label>
                <input
                  id={`${formId}-email`}
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  onBlur={() => touchField('email')}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? `${formId}-email-error` : undefined}
                  className={fieldClass(Boolean(fieldErrors.email))}
                />
                <FieldError id={`${formId}-email-error`} message={fieldErrors.email} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${formId}-phone`} className={label}>
                    Téléphone
                  </label>
                  <input
                    id={`${formId}-phone`}
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="+229 97 00 00 00"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearFieldError('phone');
                    }}
                    onBlur={() => touchField('phone')}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? `${formId}-phone-error` : undefined}
                    className={fieldClass(Boolean(fieldErrors.phone))}
                  />
                  <FieldError id={`${formId}-phone-error`} message={fieldErrors.phone} />
                </div>
                <div>
                  <label htmlFor={`${formId}-birth`} className={label}>
                    Date de naissance
                  </label>
                  <input
                    id={`${formId}-birth`}
                    type="date"
                    autoComplete="bday"
                    required
                    max={maxBirthDate}
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      clearFieldError('dateOfBirth');
                    }}
                    onBlur={() => touchField('dateOfBirth')}
                    aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                    aria-describedby={fieldErrors.dateOfBirth ? `${formId}-birth-error` : undefined}
                    className={fieldClass(Boolean(fieldErrors.dateOfBirth))}
                  />
                  <FieldError id={`${formId}-birth-error`} message={fieldErrors.dateOfBirth} />
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Inscription réservée aux {MIN_REGISTRATION_AGE_YEARS} ans et plus.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <PasswordField
                  id={`${formId}-password`}
                  labelText="Mot de passe"
                  value={password}
                  onChange={(v) => {
                    setPassword(v);
                    clearFieldError('password');
                  }}
                  onBlur={() => touchRelatedPasswordFields('password')}
                  autoComplete="new-password"
                  visible={showPasswords}
                  onToggle={() => setShowPasswords((v) => !v)}
                  error={fieldErrors.password}
                  errorId={`${formId}-password-error`}
                />
                <PasswordField
                  id={`${formId}-confirm`}
                  labelText="Confirmation"
                  value={confirmPassword}
                  onChange={(v) => {
                    setConfirmPassword(v);
                    clearFieldError('confirmPassword');
                  }}
                  onBlur={() => touchRelatedPasswordFields('confirmPassword')}
                  autoComplete="new-password"
                  visible={showPasswords}
                  onToggle={() => setShowPasswords((v) => !v)}
                  error={fieldErrors.confirmPassword}
                  errorId={`${formId}-confirm-error`}
                />
              </div>
              <p className="text-[11px] text-slate-500">Minimum 8 caractères</p>

              <LegalAcceptanceField
                id={`${formId}-terms`}
                checked={acceptedTerms}
                onChange={(checked) => {
                  setAcceptedTerms(checked);
                  if (checked) setTermsError(null);
                }}
                error={termsError ?? undefined}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Création…' : 'Créer mon compte'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
          Chargement…
        </div>
      }
    >
      <InscriptionPageContent />
    </Suspense>
  );
}
