// Utilidades para slugs - seguras para cliente (sin módulos Node.js)

export const FUENTE_CODES = { jkanime: 'jk', animeflv: 'af' } as const;
export const CODE_TO_FUENTE = { jk: 'jkanime', af: 'animeflv' } as const;
export type FuenteCode = keyof typeof CODE_TO_FUENTE;

export function extraerSlugDeUrl(url: string, fuente: 'jkanime' | 'animeflv'): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, '');
    if (fuente === 'jkanime') {
      return path.split('/').filter(Boolean)[0] || '';
    }
    if (fuente === 'animeflv') {
      const match = path.match(/\/anime\/([^/]+)/);
      return match ? match[1] : path.split('/').pop() || '';
    }
  } catch {
    return '';
  }
  return '';
}

export function reconstruirUrlAnime(slug: string, fuente: 'jkanime' | 'animeflv'): string {
  if (fuente === 'jkanime') return `https://jkanime.net/${slug}`;
  return `https://www3.animeflv.net/anime/${slug}`;
}

export function reconstruirUrlEpisodio(
  slug: string,
  episodio: number,
  fuente: 'jkanime' | 'animeflv'
): string {
  if (fuente === 'jkanime') return `https://jkanime.net/${slug}/${episodio}/`;
  return `https://www3.animeflv.net/ver/${slug}-${episodio}`;
}
