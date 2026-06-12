import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

const modules: { title: string; desc: string; href: string }[] = [
  {
    title: 'Centres',
    desc: 'Sites de prélèvement.',
    href: '/office/admin/centres',
  },
  {
    title: 'Services',
    desc: 'Prestations catalogue (prix, actif/inactif).',
    href: '/office/admin/services',
  },
  {
    title: 'Analyses',
    desc: 'Bilans du référentiel.',
    href: '/office/admin/analyses',
  },
  {
    title: 'Tarifs analyses / centre',
    desc: 'Prix de chaque analyse par laboratoire.',
    href: '/office/admin/tarifs-analyses-centres',
  },
  {
    title: 'Zones',
    desc: 'Zones géographiques / tarifaires.',
    href: '/office/admin/zones',
  },
  {
    title: 'Tarifs trajet',
    desc: 'Prix entre deux zones (identique A→B et B→A).',
    href: '/office/admin/zone-trajets',
  },
  {
    title: 'Frais supplémentaires',
    desc: 'Montants catalogue additionnels.',
    href: '/office/admin/frais',
  },
  {
    title: 'Utilisateurs',
    desc: 'Comptes équipe et patients habilités.',
    href: '/office/admin/users',
  },
];

export default function AdminHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">
          Super administrateur
      </p>
      <h2 className="mt-3 text-xl font-semibold text-slate-900">Référentiels métier</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Création, mise à jour et suppression via les routes Nest déjà sécurisées. Les changements sont
          visibles dans le catalogue public lorsque les entités sont actives.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((m) => (
            <li key={m.href}>
              <Link href={m.href} className="block h-full">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">{m.title}</CardTitle>
                    <CardDescription>{m.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="!pt-4 text-xs font-semibold text-teal-700">
                    Ouvrir →
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
