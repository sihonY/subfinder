export interface Movie {
  id: string;
  title: string;
  description?: string;
  image?: string;
  year?: string;
  plot?: string;
  poster?: string;
  rating?: string;
  director?: string;
  cast?: string;
  genres?: string;
  runtime?: string;
}

export interface Subtitle {
  id: string;
  fileName: string;
  language: string;
  downloadCount: number;
  rating: number;
  release: string;
  format: string;
  size: number;
}

export interface DownloadHistoryItem {
  fileName: string;
  filePath: string;
  size: number;
  downloadTime: Date;
  downloadDate: string;
} 