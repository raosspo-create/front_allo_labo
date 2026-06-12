/** Extrait les messages NestJS (ValidationPipe et HTTP). */
export function apiErrorMessage(data: unknown, fallback: string): string {
  if (typeof data !== 'object' || data === null || !('message' in data)) {
    return fallback;
  }
  const m = (data as { message: unknown }).message;
  if (Array.isArray(m)) {
    return m.map(String).join(', ');
  }
  if (typeof m === 'string') {
    return m;
  }
  return fallback;
}

/**
 * Retourne un message d'erreur explicite selon le type d'erreur réseau.
 * Détecte si l'API n'est pas démarrée vs. un vrai problème réseau.
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    
    // Erreur de connexion refusée (API non démarrée)
    if (message.includes('fetch') || message.includes('failed to fetch') || 
        message.includes('network') || message.includes('load')) {
      return 'API non disponible.';
    }
    
    // Timeout
    if (message.includes('timeout')) {
      return 'Le serveur met trop de temps à répondre. Réessayez dans quelques instants.';
    }
  }
  
  // Erreur générique
  return 'Impossible de contacter le serveur. Vérifiez votre connexion et que l\'API est démarrée.';
}
