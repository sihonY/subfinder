'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileText, Calendar, HardDrive, Clock, Trash2, RefreshCw, Search } from 'lucide-react';
import { DownloadHistoryItem } from '../types';

export default function DownloadHistory() {
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<DownloadHistoryItem[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    // 搜索过滤
    if (searchTerm.trim()) {
      const filtered = history.filter(item =>
        item.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHistory(filtered);
    } else {
      setFilteredHistory(history);
    }
  }, [history, searchTerm]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/subtitles/history');

      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('获取下载历史失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
  };

  const clearHistory = async () => {
    if (!confirm('确定要清空所有下载历史吗？此操作不可恢复。')) {
      return;
    }

    try {
      await axios.delete('/api/subtitles/history');
      setHistory([]);
    } catch (error) {
      console.error('清空历史失败:', error);
      alert('清空历史失败，请重试');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 2) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return `${diffDays - 1}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toUpperCase() || '';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'srt':
        return '📝';
      case 'ass':
      case 'ssa':
        return '🎬';
      case 'vtt':
        return '📄';
      case 'sub':
        return '📋';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className="card card-large">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            下载历史
          </h2>
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card card-large">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            下载历史
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredHistory.length} 项)
            </span>
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            查看和管理您的字幕下载记录
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-ghost btn-sm flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">刷新</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="btn btn-ghost btn-sm flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">清空</span>
            </button>
          )}
        </div>
      </div>

      {/* 搜索框 */}
      {history.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索文件名..."
              className="input pl-10 text-sm"
            />
          </div>
        </div>
      )}

      {/* 历史列表 */}
      {filteredHistory.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">未找到匹配项</h3>
              <p className="text-gray-500">没有找到包含 "{searchTerm}" 的下载记录</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 btn btn-secondary btn-sm"
              >
                清除搜索
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无下载记录</h3>
              <p className="text-gray-500">
                开始搜索和下载字幕，记录将会显示在这里
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item, index) => (
            <div
              key={index}
              className="group p-4 border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-4">
                {/* 文件图标 */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-lg">
                    {getFileIcon(item.fileName)}
                  </div>
                </div>

                {/* 文件信息 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base leading-tight mb-2 text-truncate-2">
                    {item.fileName}
                  </h3>

                  {/* 详细信息网格 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-3 h-3 flex-shrink-0" />
                      <span>{formatFileSize(item.size)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{formatDate(item.downloadDate)}</span>
                    </div>

                    <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                      <FileText className="w-3 h-3 flex-shrink-0" />
                      <span className="badge badge-gray text-xs">
                        {getFileExtension(item.fileName)}
                      </span>
                    </div>
                  </div>

                  {/* 文件路径 */}
                  {item.filePath && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-mono truncate" title={item.filePath}>
                        {item.filePath}
                      </p>
                    </div>
                  )}
                </div>

                {/* 状态和操作 */}
                <div className="flex flex-col items-end gap-2">
                  <div className="badge badge-success text-xs">
                    已完成
                  </div>

                  {/* 文件大小（移动端隐藏，因为已在网格中显示） */}
                  <div className="hidden sm:block text-xs text-gray-500">
                    {formatFileSize(item.size)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 底部统计 */}
      {history.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
            <span>
              总计下载 {history.length} 个文件，
              共 {history.reduce((total, item) => total + item.size, 0) > 0
                ? formatFileSize(history.reduce((total, item) => total + item.size, 0))
                : '0 B'}
            </span>

            {searchTerm && (
              <span>
                显示 {filteredHistory.length} / {history.length} 项
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 