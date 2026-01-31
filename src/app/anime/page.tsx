'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import EpisodeList from '@/components/EpisodeList';
import VideoPlayer from '@/components/VideoPlayer';
import type { AnimeDetails, Episode, VideoSource, JikanInfo } from '@/types/anime';

function AnimeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get('url');
  const fuente = searchParams.get('fuente') as 'jkanime' | 'animeflv';

  const [anime, setAnime] = useState<AnimeDetails | null>(null);
  const [jikanInfo, setJikanInfo] = useState<JikanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [videos, setVideos] = useState<VideoSource[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    if (!url || !fuente) {
      setError('URL o fuente no especificada');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const response = await fetch(
          `/api/anime/details?url=${encodeURIComponent(url)}&fuente=${fuente}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al obtener detalles');
        }

        setAnime(data.detalles);

        // Obtener info de Jikan para la portada y más detalles
        if (data.detalles?.titulo) {
          try {
            const jikanResponse = await fetch(
              `/api/anime/info?titulo=${encodeURIComponent(data.detalles.titulo)}`
            );
            const jikanData = await jikanResponse.json();
            if (jikanData.info) {
              setJikanInfo(jikanData.info);
            }
          } catch (e) {
            console.log('No se pudo obtener info de Jikan:', e);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [url, fuente]);

  const handleSelectEpisode = async (episode: Episode) => {
    setSelectedEpisode(episode);
    setLoadingVideos(true);
    setVideos([]);

    // Scroll al reproductor en mobile
    setTimeout(() => {
      document.getElementById('video-player')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const response = await fetch(
        `/api/anime/videos?url=${encodeURIComponent(episode.url)}&fuente=${fuente}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener videos');
      }

      setVideos(data.videos);
    } catch (err) {
      console.error('Error cargando videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Usar imagen de Jikan si está disponible, sino la del scraping
  const imagenFinal = jikanInfo?.images?.jpg?.large_image_url ||
                      jikanInfo?.images?.webp?.large_image_url ||
                      anime?.imagen;

  // Usar sinopsis de Jikan si está disponible y la del scraping está vacía
  const sinopsisFinal = anime?.sinopsis || jikanInfo?.synopsis || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-gray-400">Cargando información del anime...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!anime) return null;

  const episodes = anime.temporadas[0] || [];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Back Button */}
      <button
        onClick={handleGoBack}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span className="hidden sm:inline">Volver</span>
      </button>

      {/* Anime Info - Mobile optimized */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Poster */}
        <div className="w-40 sm:w-48 md:w-56 lg:w-64 flex-shrink-0 mx-auto sm:mx-0">
          <div className="relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            {imagenFinal ? (
              <Image
                src={imagenFinal}
                alt={anime.titulo}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <svg
                  className="w-12 h-12 sm:w-16 sm:h-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
              {anime.titulo}
            </h1>
            <span
              className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded flex-shrink-0 ${
                anime.fuente === 'jkanime'
                  ? 'bg-blue-600 text-white'
                  : 'bg-green-600 text-white'
              }`}
            >
              {anime.fuente === 'jkanime' ? 'JKanime' : 'AnimeFLV'}
            </span>
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>
              {anime.totalCapitulos || jikanInfo?.episodes || '?'} episodios
            </span>

            {jikanInfo?.score && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {jikanInfo.score}
              </span>
            )}

            {jikanInfo?.year && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {jikanInfo.year}
              </span>
            )}

            {jikanInfo?.status && (
              <span className={`px-2 py-0.5 rounded text-xs ${
                jikanInfo.status === 'Currently Airing'
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-gray-700 text-gray-300'
              }`}>
                {jikanInfo.status === 'Currently Airing' ? 'En emisión' :
                 jikanInfo.status === 'Finished Airing' ? 'Finalizado' : jikanInfo.status}
              </span>
            )}
          </div>

          {/* Genres */}
          {jikanInfo?.genres && jikanInfo.genres.length > 0 && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {jikanInfo.genres.slice(0, 5).map((genre) => (
                <span
                  key={genre.mal_id}
                  className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {sinopsisFinal && (
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-4 sm:line-clamp-none">
              {sinopsisFinal}
            </p>
          )}
        </div>
      </div>

      {/* Video Player */}
      <div id="video-player">
        {selectedEpisode && (
          <div className="space-y-4">
            {loadingVideos ? (
              <div className="bg-gray-800 rounded-lg p-6 sm:p-8 text-center">
                <svg
                  className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-4"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <p className="text-gray-400 text-sm sm:text-base">Cargando servidores...</p>
              </div>
            ) : videos.length > 0 ? (
              <VideoPlayer
                videos={videos}
                episodeName={`${anime.titulo} - ${selectedEpisode.numero}`}
              />
            ) : (
              <div className="bg-gray-800 rounded-lg p-6 sm:p-8 text-center">
                <p className="text-gray-400 text-sm sm:text-base">
                  No se encontraron servidores disponibles para este episodio
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Episode List */}
      {episodes.length > 0 ? (
        <EpisodeList
          episodes={episodes}
          fuente={anime.fuente}
          onSelectEpisode={handleSelectEpisode}
          selectedEpisode={selectedEpisode}
        />
      ) : (
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400">No se encontraron episodios disponibles</p>
          <p className="text-gray-500 text-sm mt-2">
            Intenta buscar el anime con otro nombre o desde otra fuente
          </p>
        </div>
      )}
    </div>
  );
}

export default function AnimePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-gray-400">Cargando...</p>
          </div>
        </div>
      }
    >
      <AnimeContent />
    </Suspense>
  );
}
