const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Mock axios and fs-extra
jest.mock('axios');
jest.mock('fs-extra');

describe('OpenSubtitlesService', () => {
  let opensubtitlesService;
  
  beforeEach(() => {
    // 设置环境变量
    process.env.OPENSUBTITLES_API_KEY = 'test-api-key';
    process.env.OPENSUBTITLES_USER_AGENT = 'test-user-agent';
    
    // 清除所有模拟
    jest.clearAllMocks();
    
    // 重新创建服务实例
    opensubtitlesService = require('../services/opensubtitlesService');
  });

  afterEach(() => {
    delete process.env.OPENSUBTITLES_API_KEY;
    delete process.env.OPENSUBTITLES_USER_AGENT;
  });

  describe('构造函数', () => {
    test('应该使用正确的API配置', () => {
      expect(opensubtitlesService.apiKey).toBe('test-api-key');
      expect(opensubtitlesService.userAgent).toBe('test-user-agent');
    });

    test('缺少API密钥时应该抛出错误', () => {
      delete process.env.OPENSUBTITLES_API_KEY;
      
      expect(() => {
        require('../services/opensubtitlesService');
      }).toThrow('OpenSubtitles API配置不完整');
    });

    test('缺少User-Agent时应该抛出错误', () => {
      delete process.env.OPENSUBTITLES_USER_AGENT;
      
      expect(() => {
        require('../services/opensubtitlesService');
      }).toThrow('OpenSubtitles API配置不完整');
    });
  });

  describe('searchSubtitles', () => {
    test('应该成功搜索字幕', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              attributes: {
                files: [{
                  file_id: '12345',
                  file_name: 'test.srt',
                  file_size: 1024
                }],
                language: 'zh-CN',
                download_count: 1000,
                ratings: 4.5,
                release: 'test-release',
                format: 'srt'
              }
            }
          ]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const result = await opensubtitlesService.searchSubtitles('测试电影', '2023', 'zh-CN');
      
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.opensubtitles.com/api/v1/subtitles',
        {
          params: {
            query: '测试电影',
            year: '2023',
            languages: 'zh-CN'
          },
          headers: {
            'Api-Key': 'test-api-key',
            'User-Agent': 'test-user-agent'
          }
        }
      );
      
      expect(result).toEqual([
        {
          id: '12345',
          fileName: 'test.srt',
          language: 'zh-CN',
          downloadCount: 1000,
          rating: 4.5,
          release: 'test-release',
          format: 'srt',
          size: 1024
        }
      ]);
    });

    test('应该处理空结果', async () => {
      const mockResponse = {
        data: {
          data: []
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const result = await opensubtitlesService.searchSubtitles('不存在的电影');
      
      expect(result).toEqual([]);
    });

    test('应该处理网络错误', async () => {
      const error = new Error('网络错误');
      axios.get.mockRejectedValue(error);
      
      await expect(opensubtitlesService.searchSubtitles('测试电影')).rejects.toThrow('网络错误');
    });
  });

  describe('downloadSubtitle', () => {
    test('应该成功下载字幕', async () => {
      const downloadResponse = {
        data: {
          link: 'https://example.com/download/test.srt'
        }
      };
      
      const fileResponse = {
        data: Buffer.from('test subtitle content')
      };
      
      axios.post.mockResolvedValue(downloadResponse);
      axios.get.mockResolvedValue(fileResponse);
      fs.ensureDir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      
      const result = await opensubtitlesService.downloadSubtitle('12345', '/path/to/test.srt');
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.opensubtitles.com/api/v1/download',
        { file_id: '12345' },
        {
          headers: {
            'Api-Key': 'test-api-key',
            'User-Agent': 'test-user-agent'
          }
        }
      );
      
      expect(axios.get).toHaveBeenCalledWith(
        'https://example.com/download/test.srt',
        { responseType: 'arraybuffer' }
      );
      
      expect(fs.ensureDir).toHaveBeenCalledWith('/path/to');
      expect(fs.writeFile).toHaveBeenCalledWith('/path/to/test.srt', Buffer.from('test subtitle content'));
      
      expect(result).toBe('/path/to/test.srt');
    });

    test('应该处理下载错误', async () => {
      const error = new Error('下载失败');
      axios.post.mockRejectedValue(error);
      
      await expect(opensubtitlesService.downloadSubtitle('12345', '/path/to/test.srt')).rejects.toThrow('下载失败');
    });
  });

  describe('getBestSubtitle', () => {
    test('应该返回首选语言的最佳字幕', () => {
      const subtitles = [
        { language: 'zh-CN', downloadCount: 100, rating: 4.0 },
        { language: 'zh-CN', downloadCount: 200, rating: 4.5 },
        { language: 'en', downloadCount: 300, rating: 4.8 }
      ];
      
      const result = opensubtitlesService.getBestSubtitle(subtitles, 'zh-CN');
      
      expect(result).toEqual({ language: 'zh-CN', downloadCount: 200, rating: 4.5 });
    });

    test('应该返回中文字幕当首选语言不可用时', () => {
      const subtitles = [
        { language: 'zh', downloadCount: 100, rating: 4.0 },
        { language: 'en', downloadCount: 300, rating: 4.8 }
      ];
      
      const result = opensubtitlesService.getBestSubtitle(subtitles, 'zh-CN');
      
      expect(result).toEqual({ language: 'zh', downloadCount: 100, rating: 4.0 });
    });

    test('应该返回英语字幕当中文不可用时', () => {
      const subtitles = [
        { language: 'en', downloadCount: 300, rating: 4.8 },
        { language: 'fr', downloadCount: 50, rating: 3.5 }
      ];
      
      const result = opensubtitlesService.getBestSubtitle(subtitles, 'zh-CN');
      
      expect(result).toEqual({ language: 'en', downloadCount: 300, rating: 4.8 });
    });

    test('应该返回null当没有字幕时', () => {
      const result = opensubtitlesService.getBestSubtitle([], 'zh-CN');
      
      expect(result).toBeNull();
    });
  });

  describe('sortByQuality', () => {
    test('应该按质量排序字幕', () => {
      const subtitles = [
        { downloadCount: 100, rating: 4.0 },
        { downloadCount: 200, rating: 4.5 },
        { downloadCount: 150, rating: 4.2 }
      ];
      
      const result = opensubtitlesService.sortByQuality(subtitles);
      
      expect(result[0]).toEqual({ downloadCount: 200, rating: 4.5 });
      expect(result[1]).toEqual({ downloadCount: 150, rating: 4.2 });
      expect(result[2]).toEqual({ downloadCount: 100, rating: 4.0 });
    });

    test('应该处理缺失的评分和下载量', () => {
      const subtitles = [
        { downloadCount: 100, rating: undefined },
        { downloadCount: undefined, rating: 4.5 },
        { downloadCount: 200, rating: 4.0 }
      ];
      
      const result = opensubtitlesService.sortByQuality(subtitles);
      
      expect(result[0]).toEqual({ downloadCount: 200, rating: 4.0 });
    });
  });
}); 