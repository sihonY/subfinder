'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Download, Star, FileText, Globe } from 'lucide-react';
import { Subtitle } from '../types';

interface SubtitleListProps {
  subtitles: Subtitle[];
  movieTitle: string;
}

export default function SubtitleList({ subtitles, movieTitle }: SubtitleListProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (subtitle: Subtitle) => {
    setDownloading(subtitle.id);
    
    try {
      const response = await axios.post('/api/subtitles/download', {
        subtitleId: subtitle.id,
        fileName: subtitle.fileName,
        movieTitle: movieTitle
      });
      
      if (response.data.success) {
        alert('字幕下载成功！');
      } else {
        alert('下载失败: ' + response.data.error);
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      'ru': '俄语'
    };
    return languages[code] || code;
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">
        字幕列表 ({subtitles.length})
      </h2>
      
      <div className="space-y-3">
        {subtitles.map((subtitle) => (
          <div
            key={subtitle.id}
            className="p-3 border border-gray-200 rounded-lg hover:border-gray-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">
                  {subtitle.fileName}
                </h3>
                
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {getLanguageName(subtitle.language)}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {subtitle.format.toUpperCase()}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {subtitle.rating.toFixed(1)}
                  </div>
                  
                  <span>{formatFileSize(subtitle.size)}</span>
                </div>
                
                <div className="text-xs text-gray-400 mt-1">
                  下载次数: {subtitle.downloadCount.toLocaleString()}
                </div>
              </div>
              
              <button
                onClick={() => handleDownload(subtitle)}
                disabled={downloading === subtitle.id}
                className="btn btn-primary text-xs ml-3 flex items-center gap-1 disabled:opacity-50"
              >
                {downloading === subtitle.id ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <Download className="w-3 h-3" />
                )}
                下载
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 