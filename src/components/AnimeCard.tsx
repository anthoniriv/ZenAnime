'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { AnimeResult } from '@/types/anime';

interface AnimeCardProps {
  anime: AnimeResult;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const encodedUrl = encodeURIComponent(anime.url);
  const href = `/anime?url=${encodedUrl}&fuente=${anime.fuente}`;

  return (
    <Link href={href} className="group">
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
        <div className="relative aspect-[3/4] bg-gray-900">
          {anime.imagen ? (
            <Image
              src={anime.imagen}
              alt={anime.titulo}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <svg
                className="w-16 h-16"
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
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${
                anime.fuente === 'jkanime'
                  ? 'bg-blue-600 text-white'
                  : 'bg-green-600 text-white'
              }`}
            >
              {anime.fuente === 'jkanime' ? 'JK' : 'FLV'}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-purple-400 transition-colors">
            {anime.titulo}
          </h3>
        </div>
      </div>
    </Link>
  );
}
