/** Étapes du parcours commande (hors annulation). */
export const ORDER_STATUS_FLOW = [
  'en_attente',
  'prise_en_compte',
  'programme',
  'arrivee_patient',
  'remise_centre',
  'resultat_rendu',
] as const;

export type OrderFlowStatus = (typeof ORDER_STATUS_FLOW)[number];

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
  en_attente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  prise_en_compte: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  programme: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  arrivee_patient: 'bg-orange-100 text-orange-800 border-orange-200',
  remise_centre: 'bg-blue-100 text-blue-800 border-blue-200',
  resultat_rendu: 'bg-green-100 text-green-800 border-green-200',
  annule: 'bg-red-100 text-red-800 border-red-200',
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function orderStatusBadgeClass(status: string): string {
  return ORDER_STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700 border-slate-200';
}

export function isOrderTerminal(status: string): boolean {
  return status === 'resultat_rendu' || status === 'annule';
}

export function isOrderInProgress(status: string): boolean {
  return !isOrderTerminal(status) && status !== 'en_attente';
}
