import Link from 'next/link';
import { fetchCatalogServices } from '@/lib/api-public';
import { buttonClassName } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default async function ServicesPage() {
  let services: Awaited<ReturnType<typeof fetchCatalogServices>> = [];
  let err: string | null = null;
  try {
    services = await fetchCatalogServices();
  } catch {
    err = 'Impossible de joindre l’API — vérifiez le serveur et la variable d’environnement.';
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-4 border-b border-slate-200/90 pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
            Référentiel
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Catalogue des prestations
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Services actifs proposés par le laboratoire. Les montants sont indicatifs ;
            la tarification finale peut dépendre de la zone ou des options.
          </p>
        </div>
        <Link href="/" className={`${buttonClassName('secondary')} shrink-0`}>
          Retour accueil
        </Link>
      </div>

      {err ? (
        <p className="mt-10 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {err}
        </p>
      ) : services.length === 0 ? (
        <p className="mt-12 text-sm text-slate-600">Aucun service actif pour le moment.</p>
      ) : (
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <li key={s.id}>
              <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                <CardHeader className="!pb-3">
                  <CardTitle className="text-lg leading-snug">{s.name}</CardTitle>
                  {s.category ? (
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-teal-700">
                      {s.category}
                    </p>
                  ) : null}
                  <CardDescription className="!mt-2 line-clamp-3">
                    {s.description ?? '—'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto border-t border-slate-100 !pt-4">
                  <p className="text-xl font-bold tabular-nums text-slate-900">
                    {s.price}{' '}
                    <span className="text-sm font-semibold text-slate-500">{s.currency}</span>
                  </p>
                  {s.duration ? (
                    <p className="mt-2 text-xs text-slate-500">Durée indicative : {s.duration}</p>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
