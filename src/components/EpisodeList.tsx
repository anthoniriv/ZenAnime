'use client';

import { useState, useMemo } from 'react';
import type { Episode } from '@/types/anime';

interface EpisodeListProps {
  episodes: Episode[];
  fuente: 'jkanime' | 'animeflv';
  onSelectEpisode: (episode: Episode) => void;
  selectedEpisode?: Episode | null;
}

const EPISODES_PER_PAGE = 50;

export default function EpisodeList({
  episodes,
  onSelectEpisode,
  selectedEpisode,
}: EpisodeListProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchEp, setSearchEp] = useState('');

  const totalPages = Math.ceil(episodes.length / EPISODES_PER_PAGE);

  const currentEpisodes = useMemo(() => {
    const start = currentPage * EPISODES_PER_PAGE;
    return episodes.slice(start, start + EPISODES_PER_PAGE);
  }, [episodes, currentPage]);

  const handleSearch = () => {
    const num = parseInt(searchEp);
    if (num >= 1 && num <= episodes.length) {
      const episode = episodes.find((ep) => {
        const epNum = parseInt(ep.numero.match(/\d+/)?.[0] || '0');
        return epNum === num;
      });
      if (episode) {
        // Cambiar a la página correcta
        const epIndex = episodes.indexOf(episode);
        const newPage = Math.floor(epIndex / EPISODES_PER_PAGE);
        setCurrentPage(newPage);
        // Seleccionar el episodio
        onSelectEpisode(episode);
      }
    }
    setSearchEp('');
  };

  const pageRanges = useMemo(() => {
    const ranges: { start: number; end: number }[] = [];
    for (let i = 0; i < totalPages; i++) {
      const start = i * EPISODES_PER_PAGE + 1;
      const end = Math.min((i + 1) * EPISODES_PER_PAGE, episodes.length);
      ranges.push({ start, end });
    }
    return ranges;
  }, [totalPages, episodes.length]);

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-white">
          Episodios ({episodes.length})
        </h3>

        <div className="flex items-center gap-2">
          {/* Episode search */}
          <div className="flex items-center">
            <input
              type="number"
              min="1"
              max={episodes.length}
              value={searchEp}
              onChange={(e) => setSearchEp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ir a #"
              className="w-20 sm:w-24 px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-l text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-r"
            >
              Ir
            </button>
          </div>

          {/* Page selector (only if many episodes) */}
          {totalPages > 1 && (
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
            >
              {pageRanges.map((range, i) => (
                <option key={i} value={i}>
                  {range.start} - {range.end}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Episode grid */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-1.5 sm:gap-2 max-h-[300px] sm:max-h-[350px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin">
        {currentEpisodes.map((episode, index) => {
          const numero = episode.numero.match(/\d+/)?.[0] || String(currentPage * EPISODES_PER_PAGE + index + 1);
          const isSelected = selectedEpisode?.url === episode.url;

          return (
            <button
              key={episode.url}
              onClick={() => onSelectEpisode(episode)}
              className={`px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded transition-all active:scale-95 ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {numero}
            </button>
          );
        })}
      </div>

      {/* Pagination controls (mobile-friendly) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-700">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-sm text-gray-400 px-2">
            {pageRanges[currentPage]?.start} - {pageRanges[currentPage]?.end} de {episodes.length}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
