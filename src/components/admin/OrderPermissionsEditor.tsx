'use client';

import {
  DEFAULT_ORDER_PERMISSIONS,
  ORDER_PERMISSION_KEYS,
  ORDER_PERMISSION_LABELS,
  type OrderPermissions,
} from '@/lib/order-permissions';

type Props = {
  value: OrderPermissions;
  onChange: (next: OrderPermissions) => void;
  disabled?: boolean;
};

export function OrderPermissionsEditor({ value, onChange, disabled }: Props) {
  return (
    <fieldset className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
        Permissions — gestion des commandes
      </legend>
      <p className="text-xs text-slate-500">
        Par défaut, seul le changement de statut est autorisé. La commission et l’affectation d’un autre agent sont désactivées.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {ORDER_PERMISSION_KEYS.map((key) => {
          const meta = ORDER_PERMISSION_LABELS[key];
          const checked = value[key];
          const isDefault = DEFAULT_ORDER_PERMISSIONS[key];
          return (
            <label
              key={key}
              className={`flex cursor-pointer gap-2 rounded-md border px-2.5 py-2 text-sm transition ${
                checked
                  ? 'border-teal-200 bg-teal-50/60 text-slate-900'
                  : 'border-slate-100 bg-slate-50/50 text-slate-700'
              } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-teal-200'}`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-600"
                checked={checked}
                disabled={disabled}
                onChange={(e) =>
                  onChange({ ...value, [key]: e.target.checked })
                }
              />
              <span className="min-w-0">
                <span className="font-medium">{meta.label}</span>
                {!isDefault && checked ? null : (
                  <span className="ml-1 text-[10px] font-normal text-slate-400">
                    {isDefault ? 'défaut' : ''}
                  </span>
                )}
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  {meta.hint}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
