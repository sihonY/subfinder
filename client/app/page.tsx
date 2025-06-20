'use client';

import React, { useState } from 'react';
import MovieSearch from '../components/MovieSearch';
import MovieList from '../components/MovieList';
import SubtitleList from '../components/SubtitleList';
import DownloadHistory from '../components/DownloadHistory';
import { Movie, Subtitle } from '../types';
import { Search, Clock, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');

  const handleMovieSearch = (searchResults: Movie[]) => {
    setMovies(searchResults);
    setSelectedMovie(null);
    setSubtitles([]);
  };

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setSubtitles([]);
  };

  const handleSubtitleSearch = (subtitleResults: Subtitle[]) => {
    setSubtitles(subtitleResults);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* 标签页导航 */}
      <div className="bg-white rounded-2xl shadow-card p-2 border border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`tab-button flex-1 sm:flex-none ${activeTab === 'search' ? 'active' : ''}`}
          >
            <Search className="w-4 h-4 mr-2 inline-block" />
            <span className="hidden sm:inline">搜索字幕</span>
            <span className="sm:hidden">搜索</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`tab-button flex-1 sm:flex-none ${activeTab === 'history' ? 'active' : ''}`}
          >
            <Clock className="w-4 h-4 mr-2 inline-block" />
            <span className="hidden sm:inline">下载历史</span>
            <span className="sm:hidden">历史</span>
          </button>
        </div>
      </div>

      {activeTab === 'search' ? (
        <div className="space-y-6 sm:space-y-8">
          {/* 搜索区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* 左侧：搜索和电影列表 */}
            <div className="lg:col-span-8 space-y-6">
              <MovieSearch onSearch={handleMovieSearch} setLoading={setLoading} />

              {movies.length > 0 && (
                <div className="animate-fade-in">
                  <MovieList
                    movies={movies}
                    selectedMovie={selectedMovie}
                    onMovieSelect={handleMovieSelect}
                    onSubtitleSearch={handleSubtitleSearch}
                    loading={loading}
                  />
                </div>
              )}
            </div>

            {/* 右侧：字幕列表 */}
            <div className="lg:col-span-4">
              {subtitles.length > 0 && (
                <div className="animate-slide-up lg:sticky lg:top-6">
                  <SubtitleList
                    subtitles={subtitles}
                    movieTitle={selectedMovie?.title || ''}
                  />
                </div>
              )}

              {/* 空状态提示 */}
              {movies.length > 0 && subtitles.length === 0 && !selectedMovie && (
                <div className="card card-compact lg:sticky lg:top-6">
                  <div className="empty-state">
                    <ChevronRight className="w-8 h-8 text-gray-300" />
                    <p className="text-sm text-gray-400 text-center">
                      点击电影项目查看可用字幕
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 首次使用提示 */}
          {movies.length === 0 && !loading && (
            <div className="card card-large text-center animate-fade-in">
              <div className="empty-state">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  开始搜索电影字幕
                </h3>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                  在上方搜索框中输入电影名称，我们将为您找到最佳匹配的字幕文件
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                  <span className="badge badge-gray">支持中英文搜索</span>
                  <span className="badge badge-gray">AI智能匹配</span>
                  <span className="badge badge-gray">多语言字幕</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          <DownloadHistory />
        </div>
      )}
    </div>
  );
} 