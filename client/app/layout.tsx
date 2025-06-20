import React from 'react';
import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: '字幕搜索器 - 智能电影字幕搜索下载',
  description: '智能字幕搜索和下载系统，支持多语言字幕自动匹配',
  keywords: '字幕, 电影, 下载, 搜索, AI翻译',
  authors: [{ name: '字幕搜索器' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
        {/* 背景装饰 */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-100/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative min-h-screen">
          <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12 max-w-7xl">
            {/* 头部区域 */}
            <header className="mb-8 sm:mb-12 text-center">
              <div className="animate-fade-in">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-3 sm:mb-4">
                  字幕搜索器
                </h1>
                <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
                  智能搜索和下载电影字幕，支持多语言自动匹配和AI翻译
                </p>

                {/* 装饰性元素 */}
                <div className="flex items-center justify-center mt-6 space-x-2">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce-gentle"></div>
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce-gentle" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce-gentle" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </header>

            {/* 主要内容区域 */}
            <main className="animate-slide-up">
              {children}
            </main>
          </div>

          {/* 页脚 */}
          <footer className="mt-16 py-8 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 text-center">
              <p className="text-gray-500 text-sm">
                © 2024 字幕搜索器. 让电影观看更精彩
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
} 