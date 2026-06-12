'use client';

import { Check, Stethoscope } from 'lucide-react';

type ServiceOption = {
  id: string;
  name: string;
  price?: string | number | null;
  basePrice?: string | number | null;
};

/** Même familles de couleurs que les badges de statut des commandes. */
const SERVICE_CARD_PALETTES = [
  {
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    borderHover: 'hover:border-amber-300',
    borderSelected: 'border-amber-500',
    ring: 'ring-amber-500/25',
    title: 'text-amber-800',
    price: 'text-amber-700',
    check: 'bg-amber-600',
  },
  {
    bg: 'bg-cyan-100',
    border: 'border-cyan-200',
    borderHover: 'hover:border-cyan-300',
    borderSelected: 'border-cyan-500',
    ring: 'ring-cyan-500/25',
    title: 'text-cyan-800',
    price: 'text-cyan-700',
    check: 'bg-cyan-600',
  },
  {
    bg: 'bg-indigo-100',
    border: 'border-indigo-200',
    borderHover: 'hover:border-indigo-300',
    borderSelected: 'border-indigo-500',
    ring: 'ring-indigo-500/25',
    title: 'text-indigo-800',
    price: 'text-indigo-700',
    check: 'bg-indigo-600',
  },
  {
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    borderHover: 'hover:border-blue-300',
    borderSelected: 'border-blue-500',
    ring: 'ring-blue-500/25',
    title: 'text-blue-800',
    price: 'text-blue-700',
    check: 'bg-blue-600',
  },
  {
    bg: 'bg-green-100',
    border: 'border-green-200',
    borderHover: 'hover:border-green-300',
    borderSelected: 'border-green-500',
    ring: 'ring-green-500/25',
    title: 'text-green-800',
    price: 'text-green-700',
    check: 'bg-green-600',
  },
  {
    bg: 'bg-purple-100',
    border: 'border-purple-200',
    borderHover: 'hover:border-purple-300',
    borderSelected: 'border-purple-500',
    ring: 'ring-purple-500/25',
    title: 'text-purple-800',
    price: 'text-purple-700',
    check: 'bg-purple-600',
  },
] as const;

function formatServicePrice(service: ServiceOption): string {
  const raw = service.price ?? service.basePrice;
  if (raw === undefined || raw === null || raw === '') {
    return '—';
  }
  if (typeof raw === 'number') {
    return raw.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  }
  return String(raw);
}

type ServiceSelectButtonsProps = {
  services: ServiceOption[];
  value: string;
  onChange: (serviceId: string) => void;
  disabled?: boolean;
};

export function ServiceSelectButtons({
  services,
  value,
  onChange,
  disabled = false,
}: ServiceSelectButtonsProps) {
  if (services.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        Aucun service disponible.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5" role="group" aria-label="Choisir un service">
      {services.map((service, index) => {
        const selected = value === service.id;
        const priceLabel = formatServicePrice(service);
        const palette = SERVICE_CARD_PALETTES[index % SERVICE_CARD_PALETTES.length];

        return (
          <button
            key={service.id}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(service.id)}
            className={[
              'flex min-w-[10.5rem] max-w-full flex-1 flex-col items-start rounded-xl border-2 px-3.5 py-3 text-left transition-all sm:max-w-[14rem]',
              palette.bg,
              selected
                ? `${palette.borderSelected} shadow-sm ring-2 ${palette.ring}`
                : `${palette.border} ${palette.borderHover}`,
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            ].join(' ')}
          >
            <span className="flex w-full items-start justify-between gap-2">
              <span className={`inline-flex items-start gap-1.5 text-sm font-semibold leading-snug ${palette.title}`}>
                <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {service.name}
              </span>
              {selected ? (
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${palette.check}`}
                >
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
              ) : null}
            </span>
            <span className={`mt-1.5 text-xs font-bold tabular-nums ${palette.price}`}>
              {priceLabel} XOF
            </span>
          </button>
        );
      })}
    </div>
  );
}
