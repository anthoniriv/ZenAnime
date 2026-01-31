// API de Jikan (MyAnimeList) para obtener información de anime
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string | null;
  score: number | null;
  episodes: number | null;
  status: string;
  rating: string | null;
  genres: { mal_id: number; name: string }[];
  studios: { mal_id: number; name: string }[];
  year: number | null;
  season: string | null;
}

interface JikanSearchResponse {
  data: JikanAnime[];
}

// Cache para evitar rate limiting
const jikanCache = new Map<string, { data: JikanAnime | null; timestamp: number }>();
const JIKAN_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(season|temporada|part|parte)\s*\d+\b/gi, '')
    .replace(/\b(2nd|3rd|4th|5th)\b/gi, '')
    .replace(/\bii+\b/gi, '')
    .trim();
}

/** Busca múltiples anime en Jikan (para mejorar búsqueda con typos) */
export async function buscarAnimeListaJikan(query: string): Promise<JikanAnime[]> {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    const searchQuery = encodeURIComponent(normalizeTitle(query).slice(0, 50));
    const response = await fetch(
      `${JIKAN_BASE_URL}/anime?q=${searchQuery}&limit=10&sfw=true&order_by=popularity`
    );
    if (!response.ok) return [];
    const data: JikanSearchResponse = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function buscarAnimeEnJikan(titulo: string): Promise<JikanAnime | null> {
  const cacheKey = normalizeTitle(titulo);
  const cached = jikanCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < JIKAN_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Esperar un poco para evitar rate limiting (4 requests/segundo)
    await new Promise(resolve => setTimeout(resolve, 300));

    const searchQuery = encodeURIComponent(normalizeTitle(titulo));
    const response = await fetch(`${JIKAN_BASE_URL}/anime?q=${searchQuery}&limit=5&sfw=true`);

    if (!response.ok) {
      if (response.status === 429) {
        console.log('Rate limited by Jikan API, using cache or skipping');
        return null;
      }
      throw new Error(`Jikan API error: ${response.status}`);
    }

    const data: JikanSearchResponse = await response.json();

    if (data.data && data.data.length > 0) {
      // Buscar la mejor coincidencia
      const normalizedSearch = normalizeTitle(titulo);

      let bestMatch = data.data[0];
      for (const anime of data.data) {
        const normalizedTitle = normalizeTitle(anime.title);
        const normalizedEnglish = anime.title_english ? normalizeTitle(anime.title_english) : '';

        if (normalizedTitle === normalizedSearch || normalizedEnglish === normalizedSearch) {
          bestMatch = anime;
          break;
        }

        if (normalizedTitle.includes(normalizedSearch) || normalizedSearch.includes(normalizedTitle)) {
          bestMatch = anime;
        }
      }

      jikanCache.set(cacheKey, { data: bestMatch, timestamp: Date.now() });
      return bestMatch;
    }

    jikanCache.set(cacheKey, { data: null, timestamp: Date.now() });
    return null;
  } catch (error) {
    console.error('Error fetching from Jikan:', error);
    return null;
  }
}

export async function obtenerInfoAnime(malId: number): Promise<JikanAnime | null> {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const response = await fetch(`${JIKAN_BASE_URL}/anime/${malId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching anime info:', error);
    return null;
  }
}
