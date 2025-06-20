'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Play, Star, Calendar, Clock, Film, Loader2, ChevronRight } from 'lucide-react';
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

  const formatRating = (rating: number) => {
    return rating ? rating.toFixed(1) : '0.0';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            搜索结果
          </h2>
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex gap-4 p-4">
                <div className="w-16 h-24 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          搜索结果
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({movies.length} 部电影)
          </span>
        </h2>

        {/* 排序说明 */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>按评分排序</span>
        </div>
      </div>

      <div className="space-y-3">
        {movies
          .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // 按评分排序
          .map((movie, index) => (
            <div
              key={movie.id}
              onClick={() => handleMovieClick(movie)}
              className={`group relative p-4 border rounded-2xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-1 ${selectedMovie?.id === movie.id
                ? 'border-primary-300 bg-gradient-to-r from-primary-50 to-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex gap-4">
                {/* 电影海报 */}
                <div className="relative flex-shrink-0">
                  {movie.image ? (
                    <img
                      src={movie.image}
                      alt={movie.title}
                      className="w-16 h-24 sm:w-20 sm:h-30 object-cover rounded-lg shadow-sm"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-24 sm:w-20 sm:h-30 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <Film className="w-6 h-6 text-gray-400" />
                    </div>
                  )}

                  {/* 选中指示器 */}
                  {selectedMovie?.id === movie.id && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* 电影信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">
                      {movie.title}
                      {movie.originalTitle && movie.originalTitle !== movie.title && (
                        <span className="text-sm font-normal text-gray-500 ml-2 hidden sm:inline">
                          ({movie.originalTitle})
                        </span>
                      )}
                    </h3>

                    {/* 评分 */}
                    {movie.rating && movie.rating > 0 && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full flex-shrink-0">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium text-yellow-700">
                          {formatRating(movie.rating)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 电影描述 */}
                  {movie.description && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-3 text-truncate-2">
                      {movie.description}
                    </p>
                  )}

                  {/* 电影详情 */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    {movie.year && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{movie.year}</span>
                      </div>
                    )}

                    {movie.runtime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{movie.runtime}</span>
                      </div>
                    )}

                    <div className="badge badge-gray text-xs">
                      {movie.resultType || '电影'}
                    </div>
                  </div>

                  {/* 加载状态 */}
                  {loadingSubtitles === movie.id && (
                    <div className="flex items-center gap-2 mt-2 text-primary-600 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">正在搜索字幕...</span>
                    </div>
                  )}
                </div>

                {/* 右侧箭头 */}
                <div className="flex items-center text-gray-400 group-hover:text-primary-500 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {/* 悬停效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            </div>
          ))}
      </div>

      {/* 底部提示 */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          点击电影卡片自动搜索可用字幕 · 按评分排序显示
        </p>
      </div>
    </div>
  );
} 