/** Chemin interne sûr après connexion (évite les redirections ouvertes). */
export function resolvePostLoginPath(next: string | null | undefined): string {
  if (!next?.trim()) {
    return '/office';
  }
  try {
    const decoded = decodeURIComponent(next.trim());
    if (decoded.startsWith('/office') && !decoded.startsWith('//')) {
      return decoded;
    }
  } catch {
    /* ignore */
  }
  return '/office';
}
