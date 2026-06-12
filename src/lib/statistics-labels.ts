export const ORDER_STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  prise_en_compte: 'Prise en compte — validé',
  programme: 'Programmé',
  arrivee_patient: 'Arrivée chez le patient',
  remise_centre: 'Remise au centre',
  resultat_rendu: 'Résultat rendu',
  annule: 'Annulé',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  en_attente: '#f59e0b',
  prise_en_compte: '#06b6d4',
  programme: '#6366f1',
  arrivee_patient: '#f97316',
  remise_centre: '#3b82f6',
  resultat_rendu: '#10b981',
  annule: '#ef4444',
};

export const ORDER_PIPELINE = [
  'en_attente',
  'prise_en_compte',
  'programme',
  'arrivee_patient',
  'remise_centre',
  'resultat_rendu',
  'annule',
] as const;

export const ROLE_LABELS: Record<string, string> = {
  client: 'Clients',
  technicien: 'Techniciens',
  coursier: 'Coursiers',
  super_admin: 'Administrateurs',
  operateur: 'Opérateurs',
};

export const ROLE_COLORS: Record<string, string> = {
  client: '#0d9488',
  technicien: '#8b5cf6',
  coursier: '#f97316',
  super_admin: '#64748b',
  operateur: '#0d9488',
};

export function formatXof(amount: string | number | null | undefined): string {
  if (amount == null || amount === '') return '—';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n).toLocaleString('fr-FR')} XOF`;
}
