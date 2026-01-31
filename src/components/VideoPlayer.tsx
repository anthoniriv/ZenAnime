'use client';

import { useState } from 'react';
import type { VideoSource } from '@/types/anime';

interface VideoPlayerProps {
  videos: VideoSource[];
  episodeName: string;
}

export default function VideoPlayer({ videos, episodeName }: VideoPlayerProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoSource | null>(
    videos[0] || null
  );

  const embedVideos = videos.filter((v) => v.tipo === 'embed');
  const directVideos = videos.filter((v) => v.tipo === 'directo');

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">{episodeName}</h3>
      </div>

      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        {selectedVideo ? (
          selectedVideo.tipo === 'embed' ? (
            <iframe
              src={selectedVideo.url}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="no-referrer"
            />
          ) : (
            <video
              src={selectedVideo.url}
              className="w-full h-full"
              controls
              autoPlay
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <p>Selecciona un servidor para ver el video</p>
          </div>
        )}
      </div>

      {/* Server Selection */}
      <div className="p-4 space-y-4">
        {embedVideos.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Servidores
            </h4>
            <div className="flex flex-wrap gap-2">
              {embedVideos.map((video, index) => (
                <button
                  key={`embed-${index}`}
                  onClick={() => setSelectedVideo(video)}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    selectedVideo?.url === video.url
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  {video.servidor}
                </button>
              ))}
            </div>
          </div>
        )}

        {directVideos.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Enlaces Directos
            </h4>
            <div className="flex flex-wrap gap-2">
              {directVideos.map((video, index) => (
                <a
                  key={`direct-${index}`}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium rounded bg-green-700 text-white hover:bg-green-600 transition-colors inline-flex items-center gap-2"
                >
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  {video.servidor}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
