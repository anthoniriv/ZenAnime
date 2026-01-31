'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import AnimeCard from '@/components/AnimeCard';
import type { AnimeResult } from '@/types/anime';

export default function Home() {
  const [results, setResults] = useState<AnimeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/anime/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar anime');
      }

      setResults(data.resultados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Busca tu Anime Favorito
          </span>
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          Sin anuncios, sin interrupciones. Solo anime.
        </p>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </section>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-center">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Results */}
      {searched && !loading && results.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            No se encontraron resultados
          </h3>
          <p className="text-gray-500">
            Intenta buscar con otro nombre o palabra clave
          </p>
        </div>
      )}

      {results.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">
            Resultados ({results.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((anime, index) => (
              <AnimeCard key={`${anime.url}-${index}`} anime={anime} />
            ))}
          </div>
        </section>
      )}

      {/* Features Section - Only shown when no search */}
      {!searched && (
        <section className="py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-900/50 rounded-lg mb-4">
                <svg
                  className="w-7 h-7 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Búsqueda Rápida
              </h3>
              <p className="text-gray-400">
                Encuentra cualquier anime en segundos buscando desde múltiples fuentes
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-pink-900/50 rounded-lg mb-4">
                <svg
                  className="w-7 h-7 text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Sin Anuncios
              </h3>
              <p className="text-gray-400">
                Disfruta de tu anime sin interrupciones ni pop-ups molestos
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-900/50 rounded-lg mb-4">
                <svg
                  className="w-7 h-7 text-blue-400"
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
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Múltiples Servidores
              </h3>
              <p className="text-gray-400">
                Varios servidores de reproducción para asegurar disponibilidad
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
