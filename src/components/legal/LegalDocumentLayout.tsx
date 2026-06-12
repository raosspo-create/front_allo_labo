import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClassName } from '@/components/ui/Button';

type LegalDocumentLayoutProps = {
  title: string;
  updatedAt: string;
  children: ReactNode;
};

export function LegalDocumentLayout({
  title,
  updatedAt,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-4 border-b border-slate-200/90 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            Informations légales
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">Dernière mise à jour : {updatedAt}</p>
        </div>
        <Link href="/" className={`${buttonClassName('secondary')} shrink-0`}>
          Retour accueil
        </Link>
      </div>

      <article className="mt-10 space-y-4 text-sm leading-relaxed text-slate-600 [&_a]:font-medium [&_a]:text-teal-800 [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:scroll-mt-24 [&_h2]:pt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-slate-900 [&_h3]:pt-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_p]:text-slate-600 [&_strong]:font-semibold [&_strong]:text-slate-800 [&_ul]:space-y-1.5 [&_ul]:py-1">
        {children}
      </article>
    </div>
  );
}
