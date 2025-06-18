'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';
import { Movie } from '../types';

interface MovieSearchProps {
  onSearch: (movies: Movie[]) => void;
  setLoading: (loading: boolean) => void;
}

export default function MovieSearch({ onSearch, setLoading }: MovieSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setIsSearching(true);
    setLoading(true);

    try {
      const response = await axios.get(`/api/movies/search?q=${encodeURIComponent(query.trim())}`);
      
      if (response.data.success) {
        onSearch(response.data.data);
      } else {
        console.error('搜索失败:', response.data.error);
      }
    } catch (error) {
      console.error('搜索出错:', error);
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">搜索电影</h2>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入电影名称..."
            className="input flex-1"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            搜索
          </button>
        </div>
      </form>
    </div>
  );
} 