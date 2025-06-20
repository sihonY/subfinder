'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, Sparkles, X } from 'lucide-react';
import { Movie } from '../types';

interface MovieSearchProps {
  onSearch: (movies: Movie[]) => void;
  setLoading: (loading: boolean) => void;
}

export default function MovieSearch({ onSearch, setLoading }: MovieSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('search-history');
    if (history) {
      setSearchHistory(JSON.parse(history).slice(0, 5));
    }
  }, []);

  // 保存搜索历史
  const saveToHistory = (searchTerm: string) => {
    const newHistory = [searchTerm, ...searchHistory.filter(item => item !== searchTerm)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('search-history', JSON.stringify(newHistory));
  };

  const handleSearch = async (searchTerm?: string) => {
    const searchQuery = searchTerm || query;

    if (!searchQuery.trim()) {
      inputRef.current?.focus();
      return;
    }

    setIsSearching(true);
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/movies/search?q=${encodeURIComponent(searchQuery.trim())}`);

      if (response.data.success) {
        onSearch(response.data.data);
        saveToHistory(searchQuery.trim());
        setShowHistory(false);
      } else {
        setError(response.data.error || '搜索失败，请重试');
      }
    } catch (error: any) {
      console.error('搜索出错:', error);
      if (error.code === 'ECONNABORTED') {
        setError('搜索超时，请检查网络连接');
      } else if (error.response?.status === 500) {
        setError('服务器错误，请稍后重试');
      } else {
        setError('搜索失败，请重试');
      }
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    handleSearch(historyItem);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search-history');
    setShowHistory(false);
  };

  const clearQuery = () => {
    setQuery('');
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="card card-large relative">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            搜索电影
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            输入电影名称，支持中英文搜索
          </p>
        </div>

        {/* AI标识 */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-purple-700 text-xs font-medium">AI匹配</span>
        </div>
      </div>

      {/* 搜索表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="relative flex">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
              }}
              onFocus={() => setShowHistory(searchHistory.length > 0)}
              onBlur={() => setTimeout(() => setShowHistory(false), 150)}
              placeholder="输入电影名称，如：阿凡达、Inception..."
              className={`input flex-1 pr-20 text-base ${error ? 'input-error' : ''}`}
              disabled={isSearching}
            />

            {/* 清除按钮 */}
            {query && (
              <button
                type="button"
                onClick={clearQuery}
                className="absolute right-16 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* 搜索按钮 */}
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary btn-sm px-4 flex items-center gap-2 disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">搜索中</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">搜索</span>
                </>
              )}
            </button>
          </div>

          {/* 搜索历史下拉 */}
          {showHistory && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 animate-slide-up">
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">搜索历史</span>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    清除
                  </button>
                </div>
              </div>
              <div className="py-2">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleHistoryClick(item)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-error-50 border border-error-200 rounded-xl animate-slide-up">
            <p className="text-error-700 text-sm flex items-center gap-2">
              <div className="w-4 h-4 bg-error-500 rounded-full flex-shrink-0"></div>
              {error}
            </p>
          </div>
        )}

        {/* 快捷提示 */}
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-gray-500">快捷键：</span>
          <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-200 rounded text-gray-600">
            Enter
          </kbd>
          <span className="text-xs text-gray-400">搜索</span>
        </div>
      </form>
    </div>
  );
} 