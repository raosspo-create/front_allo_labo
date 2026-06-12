import Link from 'next/link';
import { PRIVACY_POLICY_PATH, TERMS_OF_USE_PATH } from '@/lib/legal';

type LegalAcceptanceFieldProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
};

export function LegalAcceptanceField({
  id,
  checked,
  onChange,
  error,
}: LegalAcceptanceFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-slate-600"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-700 focus:ring-teal-500/25"
        />
        <span>
          J’accepte les{' '}
          <Link
            href={TERMS_OF_USE_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-teal-800 hover:text-teal-900 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            conditions d’utilisation
          </Link>{' '}
          et la{' '}
          <Link
            href={PRIVACY_POLICY_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-teal-800 hover:text-teal-900 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            politique de confidentialité
          </Link>{' '}
          d’Allo-Labo.
        </span>
      </label>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[11px] text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
