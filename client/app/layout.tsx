import React from 'react';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '字幕搜索器',
  description: '智能字幕搜索和下载系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              字幕搜索器
            </h1>
            <p className="text-gray-600 text-center mt-2">
              智能搜索和下载电影字幕
            </p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
} 