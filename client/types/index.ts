export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  description?: string;
  image?: string;
  year?: string;
  plot?: string;
  poster?: string;
  rating?: number;
  director?: string;
  cast?: string;
  genres?: string;
  runtime?: string;
  resultType?: string;
}

export interface Subtitle {
  id: string;
  fileName: string;
  language: string;
  downloadCount: number;
  rating: number;
  release: string;
  size: number;
  subtitleId: string;
  uploadDate: string;
  hd: boolean;
  fps: number;
  comments: string;
  aiTranslated: boolean;
  machineTranslated: boolean;
}

export interface DownloadHistoryItem {
  fileName: string;
  filePath: string;
  size: number;
  downloadTime: Date;
  downloadDate: string;
} 