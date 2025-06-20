'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Download, Star, FileText, Globe, Clock, MessageSquare, Sparkles, Monitor, Languages, Users, HardDrive } from 'lucide-react';
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

  const getQualityBadge = (subtitle: Subtitle) => {
    const badges = [];

    if (subtitle.hd) {
      badges.push(
        <span key="hd" className="badge badge-primary flex items-center gap-1">
          <Monitor className="w-3 h-3" />
          HD
        </span>
      );
    }

    if (subtitle.aiTranslated) {
      badges.push(
        <span key="ai" className="badge badge-success flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI翻译
        </span>
      );
    }

    if (subtitle.machineTranslated) {
      badges.push(
        <span key="machine" className="badge badge-warning flex items-center gap-1">
          <Languages className="w-3 h-3" />
          机器翻译
        </span>
      );
    }

    return badges;
  };

  if (subtitles.length === 0) {
    return (
      <div className="card lg:sticky lg:top-6">
        <div className="empty-state">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无字幕</h3>
          <p className="text-gray-500 text-sm text-center">
            未找到匹配的字幕文件
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card lg:sticky lg:top-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              字幕列表
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              为《{movieTitle}》找到 {subtitles.length} 个字幕文件
            </p>
          </div>

          {/* 排序说明 */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>按质量排序</span>
          </div>
        </div>

        <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
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
            .map((subtitle, index) => (
              <div
                key={subtitle.id}
                className="group border border-gray-200 rounded-2xl p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* 文件名和标签 */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm leading-tight text-truncate-2">
                      {subtitle.fileName}
                    </h3>

                    {/* 质量标签 */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {getQualityBadge(subtitle)}
                    </div>
                  </div>

                  {/* 下载按钮 */}
                  <button
                    onClick={() => handleDownloadClick(subtitle)}
                    disabled={downloading === subtitle.id}
                    className="btn btn-primary btn-sm flex items-center gap-2 flex-shrink-0"
                  >
                    {downloading === subtitle.id ? (
                      <>
                        <div className="w-3 h-3 loading-spinner" />
                        <span className="hidden sm:inline">下载中</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        <span className="hidden sm:inline">下载</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 详细信息 */}
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{getLanguageName(subtitle.language)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 flex-shrink-0" />
                    <span>{subtitle.downloadCount?.toLocaleString() || 0}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    <span>
                      {typeof subtitle.rating === 'number' && subtitle.rating > 0
                        ? subtitle.rating.toFixed(1)
                        : '无评分'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <HardDrive className="w-3 h-3 flex-shrink-0" />
                    <span>{formatFileSize(subtitle.size || 0)}</span>
                  </div>
                </div>

                {/* 额外信息 */}
                {(subtitle.release || subtitle.uploadDate || subtitle.fps > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {subtitle.release && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-24">{subtitle.release}</span>
                        </div>
                      )}

                      {subtitle.fps > 0 && (
                        <div className="flex items-center gap-1">
                          <span>FPS: {subtitle.fps}</span>
                        </div>
                      )}

                      {subtitle.uploadDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(subtitle.uploadDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* 评论 */}
                    {subtitle.comments && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-600 text-truncate-2">
                            {subtitle.comments}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            按质量和下载次数排序 · 支持多种格式
          </p>
        </div>
      </div>

      {/* 目录选择模态框 */}
      {showDirectoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">选择保存位置</h3>

              {loadingDirectories ? (
                <div className="empty-state">
                  <div className="w-8 h-8 loading-spinner mx-auto mb-2" />
                  <p className="text-sm text-gray-500">加载目录中...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {/* 默认位置选项 */}
                    <button
                      onClick={() => handleDownload()}
                      className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Download className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">默认下载目录</div>
                          <div className="text-sm text-gray-500">使用系统配置的默认字幕下载目录</div>
                        </div>
                      </div>
                    </button>

                    {/* 电影目录选项 */}
                    {directories.map((directory) => (
                      <button
                        key={directory.path}
                        onClick={() => handleDownload(directory.path)}
                        className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{directory.name}</div>
                            <div className="text-sm text-gray-500 truncate">{directory.path}</div>
                          </div>
                        </div>
                      </button>
                    ))}

                    {directories.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">未找到电影目录</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDirectoryModal(false);
                        setSelectedSubtitle(null);
                      }}
                      className="flex-1 btn btn-secondary"
                    >
                      取消
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 