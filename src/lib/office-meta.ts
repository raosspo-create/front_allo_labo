/** Titre principal de la barre supérieure selon la route `/office`. */
export function officePageTitle(pathname: string | null): string {
  if (!pathname?.startsWith('/office')) return 'Application';
  if (pathname === '/office') return 'Tableau de bord';
  if (/^\/office\/commandes\/[^/]+$/.test(pathname)) return 'Commande';
  if (pathname === '/office/commandes') return 'Commandes';
  if (pathname === '/office/rendez-vous') return 'Mes rendez-vous';
  if (pathname === '/office/admin/planning') return 'Planning global';
  if (pathname === '/office/factures') return 'Factures';
  if (pathname === '/office/profil') return 'Mon profil';
  if (pathname === '/office/statistiques') return 'Indicateurs & synthèses';
  if (pathname === '/office/admin') return 'Référentiels';
  if (pathname.startsWith('/office/admin/')) return 'Administration';
  return 'Application';
}
