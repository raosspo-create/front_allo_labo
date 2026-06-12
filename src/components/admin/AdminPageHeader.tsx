import Link from 'next/link';

export function AdminPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/90 pb-6">
      <div>
        <Link
          href="/office/admin"
          className="text-xs font-semibold text-teal-800 hover:text-teal-950"
        >
          ← Référentiels
        </Link>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p> : null}
      </div>
    </div>
  );
}
