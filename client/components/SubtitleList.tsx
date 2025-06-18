'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Download, Star, FileText, Globe, Clock, MessageSquare, Sparkles, Monitor } from 'lucide-react';
import { Subtitle } from '../types';

interface Directory {
  name: string;
  path: string;
  relativePath: string;
}

interface SubtitleListProps {
  subtitles: Subtitle[];
  movieTitle: string;
}

export default function SubtitleList({ subtitles, movieTitle }: SubtitleListProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<Subtitle | null>(null);
  const [loadingDirectories, setLoadingDirectories] = useState(false);

  const handleDownloadClick = async (subtitle: Subtitle) => {
    setSelectedSubtitle(subtitle);
    setShowDirectoryModal(true);
    await loadDirectories();
  };

  const handleDownload = async (savePath?: string) => {
    if (!selectedSubtitle) return;

    setDownloading(selectedSubtitle.id);
    setShowDirectoryModal(false);

    try {
      const response = await axios.post('/api/subtitles/download', {
        subtitleId: selectedSubtitle.id,
        fileName: selectedSubtitle.fileName,
        savePath: savePath
      });

      if (response.data.success) {
        alert(`字幕下载成功！\n保存位置: ${response.data.data.directory}`);
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      setDownloading(null);
      setSelectedSubtitle(null);
    }
  };

  const loadDirectories = async () => {
    setLoadingDirectories(true);
    try {
      const response = await axios.get('/api/subtitles/directories');
      if (response.data.success) {
        setDirectories(response.data.data);
      }
    } catch (error) {
      console.error('加载目录列表失败:', error);
      alert('加载目录列表失败');
    } finally {
      setLoadingDirectories(false);
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
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      'zh-CN': '简体中文',
      'zh-TW': '繁体中文',
      'zh': '中文',
      'en': '英语',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语',
      'ru': '俄语',
      'pt-BR': '葡萄牙语(巴西)'
    };
    return languages[code] || code;
  };

  return (
    <>
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">
          字幕列表 ({subtitles.length})
        </h2>

        <div className="space-y-3">
          {subtitles
            .sort((a, b) => {
              // 优先按rating排序，没有rating则按downloadCount排序
              const ratingA = typeof a.rating === 'number' && a.rating > 0 ? a.rating : 0;
              const ratingB = typeof b.rating === 'number' && b.rating > 0 ? b.rating : 0;

              if (ratingA !== ratingB) {
                return ratingB - ratingA; // rating降序
              }

              // rating相同时按downloadCount排序
              return (b.downloadCount || 0) - (a.downloadCount || 0);
            })
            .map((subtitle) => (
              <div
                key={subtitle.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 flex-1">
                        {subtitle.fileName}
                      </h3>
                      <div className="flex gap-1">
                        {subtitle.hd && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Monitor className="w-3 h-3 mr-1" />
                            HD
                          </span>
                        )}
                        {subtitle.aiTranslated && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI翻译
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadClick(subtitle)}
                    disabled={downloading === subtitle.id}
                    className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {downloading === subtitle.id ? '下载中...' : '下载'}
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {getLanguageName(subtitle.language)}
                  </div>

                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {subtitle.release ? subtitle.release : '-'}
                  </div>

                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {typeof subtitle.rating === 'number' && subtitle.rating > 0
                      ? subtitle.rating.toFixed(1)
                      : '-'}
                  </div>

                  {subtitle.fps > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs">FPS: {subtitle.fps}</span>
                    </div>
                  )}

                  {subtitle.uploadDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(subtitle.uploadDate)}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>下载次数: {subtitle.downloadCount?.toLocaleString() || 0}</span>
                  {subtitle.comments && (
                    <div className="flex items-center gap-1" title={subtitle.comments}>
                      <MessageSquare className="w-3 h-3" />
                      <span className="truncate max-w-32">{subtitle.comments}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 目录选择模态框 */}
      {showDirectoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">选择保存位置</h3>

            {loadingDirectories ? (
              <div className="text-center py-4">加载目录中...</div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {/* 默认位置选项 */}
                  <button
                    onClick={() => handleDownload()}
                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">默认下载目录</div>
                    <div className="text-sm text-gray-500">使用系统配置的默认字幕下载目录</div>
                  </button>

                  {/* 电影目录选项 */}
                  {directories.map((directory) => (
                    <button
                      key={directory.path}
                      onClick={() => handleDownload(directory.path)}
                      className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium">{directory.name}</div>
                      <div className="text-sm text-gray-500">{directory.path}</div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDirectoryModal(false);
                      setSelectedSubtitle(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
} 