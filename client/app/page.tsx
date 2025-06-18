'use client';

import React, { useState } from 'react';
import MovieSearch from '../components/MovieSearch';
import MovieList from '../components/MovieList';
import SubtitleList from '../components/SubtitleList';
import DownloadHistory from '../components/DownloadHistory';
import { Movie, Subtitle } from '../types';

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
    <div className="max-w-6xl mx-auto">
      {/* 标签页 */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'search'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          搜索字幕
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'history'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          下载历史
        </button>
      </div>

      {activeTab === 'search' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：搜索和电影列表 */}
          <div className="lg:col-span-2 space-y-6">
            <MovieSearch onSearch={handleMovieSearch} setLoading={setLoading} />
            
            {movies.length > 0 && (
              <MovieList
                movies={movies}
                selectedMovie={selectedMovie}
                onMovieSelect={handleMovieSelect}
                onSubtitleSearch={handleSubtitleSearch}
                loading={loading}
              />
            )}
          </div>

          {/* 右侧：字幕列表 */}
          <div className="lg:col-span-1">
            {subtitles.length > 0 && (
              <SubtitleList
                subtitles={subtitles}
                movieTitle={selectedMovie?.title || ''}
              />
            )}
          </div>
        </div>
      ) : (
        <DownloadHistory />
      )}
    </div>
  );
} 