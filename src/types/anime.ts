export interface AnimeResult {
  titulo: string;
  url: string;
  imagen?: string;
  fuente: 'jkanime' | 'animeflv';
}

export interface Episode {
  numero: string;
  url: string;
}

export interface AnimeDetails {
  titulo: string;
  temporadas: Episode[][];
  totalCapitulos: number;
  fuente: 'jkanime' | 'animeflv';
  slug: string;
  imagen?: string;
  sinopsis?: string;
}

export interface VideoSource {
  servidor: string;
  url: string;
  tipo: 'embed' | 'directo';
}

export interface JikanInfo {
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

export interface SearchState {
  query: string;
  results: AnimeResult[];
  loading: boolean;
  error: string | null;
}

export interface AnimeState {
  anime: AnimeDetails | null;
  loading: boolean;
  error: string | null;
}

export interface VideoState {
  videos: VideoSource[];
  loading: boolean;
  error: string | null;
  currentEpisode: string;
}
