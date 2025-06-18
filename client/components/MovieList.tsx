'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Play, Star, Calendar, Clock } from 'lucide-react';
import { Movie, Subtitle } from '../types';

interface MovieListProps {
  movies: Movie[];
  selectedMovie: Movie | null;
  onMovieSelect: (movie: Movie) => void;
  onSubtitleSearch: (subtitles: Subtitle[]) => void;
  loading: boolean;
}

export default function MovieList({
  movies,
  selectedMovie,
  onMovieSelect,
  onSubtitleSearch,
  loading
}: MovieListProps) {
  const [loadingSubtitles, setLoadingSubtitles] = useState<string | null>(null);

  const handleMovieClick = async (movie: Movie) => {
    onMovieSelect(movie);

    // 自动搜索字幕
    setLoadingSubtitles(movie.id);

    try {
      const response = await axios.get(`/api/subtitles/search?tmdbId=${movie.id}&title=${encodeURIComponent(movie.title)}&year=${movie.year || ''}`);

      if (response.data.success) {
        onSubtitleSearch(response.data.data);
      }
    } catch (error) {
      console.error('搜索字幕失败:', error);
    } finally {
      setLoadingSubtitles(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">搜索结果 ({movies.length})</h2>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">搜索中...</p>
        </div>
      )}

      <div className="space-y-4">
        {movies.map((movie) => (
          <div
            key={movie.id}
            onClick={() => handleMovieClick(movie)}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedMovie?.id === movie.id
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
          >
            <div className="flex gap-4">
              {movie.image && (
                <img
                  src={movie.image}
                  alt={movie.title}
                  className="w-16 h-24 object-cover rounded"
                />
              )}

              <div className="flex-1">
                <h3 className="font-semibold text-lg">{movie.title}</h3>

                {movie.description && (
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {movie.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  {movie.year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {movie.year}
                    </div>
                  )}

                  {movie.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {movie.rating}
                    </div>
                  )}

                  {movie.runtime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {movie.runtime}
                    </div>
                  )}
                </div>

                {loadingSubtitles === movie.id && (
                  <div className="flex items-center gap-2 mt-2 text-primary-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span className="text-sm">搜索字幕中...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <Play className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 