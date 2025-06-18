const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');

// Mock dependencies
jest.mock('chokidar');
jest.mock('fs-extra');
jest.mock('../services/movieProcessor');

describe('FileWatcher', () => {
  let fileWatcher;
  
  beforeEach(() => {
    // 设置环境变量
    process.env.MOVIE_WATCH_DIR = '/test/movies';
    
    // 清除所有模拟
    jest.clearAllMocks();
    
    // 重新创建服务实例
    fileWatcher = require('../services/fileWatcher');
  });

  afterEach(() => {
    delete process.env.MOVIE_WATCH_DIR;
  });

  describe('构造函数', () => {
    test('应该正确初始化监控目录', () => {
      expect(fileWatcher.watchDir).toBe('/test/movies');
      expect(fileWatcher.isWatching).toBe(false);
      expect(fileWatcher.processedFiles).toBeInstanceOf(Set);
    });
  });

  describe('startWatching', () => {
    test('应该启动文件监控', () => {
      fs.existsSync.mockReturnValue(true);
      
      fileWatcher.startWatching();
      
      expect(chokidar.watch).toHaveBeenCalledWith('/test/movies', {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        depth: 2,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        }
      });
      
      expect(fileWatcher.isWatching).toBe(true);
    });

    test('监控目录不存在时应该警告', () => {
      fs.existsSync.mockReturnValue(false);
      
      fileWatcher.startWatching();
      
      expect(chokidar.watch).not.toHaveBeenCalled();
    });

    test('已经在监控时不应该重复启动', () => {
      fs.existsSync.mockReturnValue(true);
      fileWatcher.isWatching = true;
      
      fileWatcher.startWatching();
      
      expect(chokidar.watch).not.toHaveBeenCalled();
    });
  });

  describe('stopWatching', () => {
    test('应该停止文件监控', () => {
      const mockWatcher = {
        close: jest.fn()
      };
      fileWatcher.watcher = mockWatcher;
      fileWatcher.isWatching = true;
      
      fileWatcher.stopWatching();
      
      expect(mockWatcher.close).toHaveBeenCalled();
      expect(fileWatcher.watcher).toBeNull();
      expect(fileWatcher.isWatching).toBe(false);
    });

    test('没有监控器时应该安全处理', () => {
      fileWatcher.watcher = null;
      
      expect(() => {
        fileWatcher.stopWatching();
      }).not.toThrow();
    });
  });

  describe('isVideoFile', () => {
    test('应该识别视频文件', () => {
      expect(fileWatcher.isVideoFile('/path/to/movie.mp4')).toBe(true);
      expect(fileWatcher.isVideoFile('/path/to/movie.avi')).toBe(true);
      expect(fileWatcher.isVideoFile('/path/to/movie.mkv')).toBe(true);
      expect(fileWatcher.isVideoFile('/path/to/movie.mov')).toBe(true);
    });

    test('应该排除非视频文件', () => {
      expect(fileWatcher.isVideoFile('/path/to/movie.txt')).toBe(false);
      expect(fileWatcher.isVideoFile('/path/to/movie.jpg')).toBe(false);
      expect(fileWatcher.isVideoFile('/path/to/movie.srt')).toBe(false);
    });

    test('应该处理大小写', () => {
      expect(fileWatcher.isVideoFile('/path/to/movie.MP4')).toBe(true);
      expect(fileWatcher.isVideoFile('/path/to/movie.AVI')).toBe(true);
    });
  });

  describe('findVideoFiles', () => {
    test('应该找到目录中的视频文件', async () => {
      const mockFiles = ['movie1.mp4', 'movie2.avi', 'readme.txt'];
      const mockStats = {
        isFile: () => true,
        size: 1024
      };
      
      fs.readdir.mockResolvedValue(mockFiles);
      fs.stat.mockResolvedValue(mockStats);
      
      const result = await fileWatcher.findVideoFiles('/test/dir');
      
      expect(result).toEqual([
        '/test/dir/movie1.mp4',
        '/test/dir/movie2.avi'
      ]);
    });

    test('应该处理目录读取错误', async () => {
      fs.readdir.mockRejectedValue(new Error('读取错误'));
      
      const result = await fileWatcher.findVideoFiles('/test/dir');
      
      expect(result).toEqual([]);
    });

    test('应该过滤非文件项目', async () => {
      const mockFiles = ['movie1.mp4', 'subdir'];
      const mockStats = {
        isFile: () => false,
        size: 1024
      };
      
      fs.readdir.mockResolvedValue(mockFiles);
      fs.stat.mockResolvedValue(mockStats);
      
      const result = await fileWatcher.findVideoFiles('/test/dir');
      
      expect(result).toEqual([]);
    });
  });

  describe('handleNewFile', () => {
    test('应该处理新的视频文件', () => {
      const filePath = '/test/movies/movie.mp4';
      
      fileWatcher.handleNewFile(filePath);
      
      expect(fileWatcher.processedFiles.has(filePath)).toBe(true);
    });

    test('应该忽略非视频文件', () => {
      const filePath = '/test/movies/readme.txt';
      
      fileWatcher.handleNewFile(filePath);
      
      expect(fileWatcher.processedFiles.has(filePath)).toBe(false);
    });

    test('应该避免重复处理', () => {
      const filePath = '/test/movies/movie.mp4';
      fileWatcher.processedFiles.add(filePath);
      
      fileWatcher.handleNewFile(filePath);
      
      expect(fileWatcher.processedFiles.size).toBe(1);
    });
  });

  describe('handleNewDirectory', () => {
    test('应该处理新目录', async () => {
      const dirPath = '/test/movies/new-movie';
      const mockVideoFiles = ['/test/movies/new-movie/movie.mp4'];
      
      fileWatcher.findVideoFiles = jest.fn().mockResolvedValue(mockVideoFiles);
      fileWatcher.handleNewFile = jest.fn();
      
      await fileWatcher.handleNewDirectory(dirPath);
      
      expect(fileWatcher.findVideoFiles).toHaveBeenCalledWith(dirPath);
      expect(fileWatcher.handleNewFile).toHaveBeenCalledWith(mockVideoFiles[0]);
    });

    test('应该忽略根目录', async () => {
      const dirPath = '/test/movies';
      
      fileWatcher.findVideoFiles = jest.fn();
      
      await fileWatcher.handleNewDirectory(dirPath);
      
      expect(fileWatcher.findVideoFiles).not.toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    test('应该返回监控状态', () => {
      fileWatcher.isWatching = true;
      fileWatcher.processedFiles.add('file1.mp4');
      fileWatcher.processedFiles.add('file2.mp4');
      
      const status = fileWatcher.getStatus();
      
      expect(status).toEqual({
        isWatching: true,
        watchDir: '/test/movies',
        processedFilesCount: 2
      });
    });
  });
}); 