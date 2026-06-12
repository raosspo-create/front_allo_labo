/** Identifie un service « bilan » (ex. « Bilan de santé (Analyses) ») — même logique que le formulaire commande. */
export function serviceNameIndicatesBilan(name: string | undefined | null): boolean {
  return (name ?? '').toLowerCase().includes('bilan');
}
