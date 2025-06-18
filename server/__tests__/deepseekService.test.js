const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('DeepSeekService', () => {
  let deepseekService;
  
  beforeEach(() => {
    // 设置环境变量
    process.env.DEEPSEEK_API_KEY = 'test-api-key';
    
    // 清除所有模拟
    jest.clearAllMocks();
    
    // 重新创建服务实例
    deepseekService = require('../services/deepseekService');
  });

  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
  });

  describe('构造函数', () => {
    test('应该使用正确的API密钥', () => {
      expect(deepseekService.apiKey).toBe('test-api-key');
    });

    test('缺少API密钥时应该抛出错误', () => {
      delete process.env.DEEPSEEK_API_KEY;
      
      expect(() => {
        require('../services/deepseekService');
      }).toThrow('DeepSeek API密钥未配置');
    });
  });

  describe('simplifyMovieName', () => {
    test('应该成功简化电影名称', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: '测试电影'
            }
          }]
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      const result = await deepseekService.simplifyMovieName('测试电影.2023.1080p.BluRay.x264');
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: expect.stringContaining('测试电影.2023.1080p.BluRay.x264')
            }
          ],
          temperature: 0.1,
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
        }
      );
      
      expect(result).toBe('测试电影');
    });

    test('应该处理API错误', async () => {
      const error = new Error('API错误');
      axios.post.mockRejectedValue(error);
      
      await expect(deepseekService.simplifyMovieName('测试电影')).rejects.toThrow('API错误');
    });

    test('应该处理空响应', async () => {
      const mockResponse = {
        data: {
          choices: []
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      await expect(deepseekService.simplifyMovieName('测试电影')).rejects.toThrow();
    });

    test('应该处理特殊字符的电影名称', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: '特殊电影'
            }
          }]
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      const result = await deepseekService.simplifyMovieName('特殊电影 & 符号 (2023) [1080p]');
      
      expect(result).toBe('特殊电影');
    });
  });

  describe('translateSubtitle', () => {
    test('应该成功翻译字幕', async () => {
      const subtitleContent = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:05,000 --> 00:00:08,000
How are you?`;

      const translatedContent = `1
00:00:01,000 --> 00:00:04,000
你好世界

2
00:00:05,000 --> 00:00:08,000
你好吗？`;

      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: translatedContent
            }
          }]
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      const result = await deepseekService.translateSubtitle(subtitleContent, 'zh-CN');
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: expect.stringContaining('请将以下字幕内容翻译成zh-CN')
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
        }
      );
      
      expect(result).toBe(translatedContent);
    });

    test('应该使用默认目标语言', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: '翻译结果'
            }
          }]
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      await deepseekService.translateSubtitle('test content');
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: expect.stringContaining('请将以下字幕内容翻译成zh-CN')
            }
          ]
        }),
        expect.any(Object)
      );
    });

    test('应该处理翻译错误', async () => {
      const error = new Error('翻译失败');
      axios.post.mockRejectedValue(error);
      
      await expect(deepseekService.translateSubtitle('test content')).rejects.toThrow('翻译失败');
    });

    test('应该处理空字幕内容', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: ''
            }
          }]
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      const result = await deepseekService.translateSubtitle('');
      
      expect(result).toBe('');
    });

    test('应该处理长字幕内容', async () => {
      const longContent = 'A'.repeat(5000);
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: '翻译结果'
            }
          }]
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      await deepseekService.translateSubtitle(longContent);
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          max_tokens: 2000
        }),
        expect.any(Object)
      );
    });
  });

  describe('边界情况', () => {
    test('应该处理包含换行符的内容', async () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: '翻译结果'
            }
          }]
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      await deepseekService.translateSubtitle(content);
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: expect.stringContaining('Line 1\nLine 2\nLine 3')
            }
          ]
        }),
        expect.any(Object)
      );
    });

    test('应该处理包含特殊字符的内容', async () => {
      const content = '特殊字符: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: '翻译结果'
            }
          }]
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      await deepseekService.translateSubtitle(content);
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: expect.stringContaining('特殊字符: !@#$%^&*()_+-=[]{}|;:,.<>?')
            }
          ]
        }),
        expect.any(Object)
      );
    });
  });
}); 