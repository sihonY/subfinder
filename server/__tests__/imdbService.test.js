const axios = require('axios');
const IMDBService = require('../services/imdbService');

// Mock axios
jest.mock('axios');

describe('IMDBService', () => {
  let imdbService;
  
  beforeEach(() => {
    // 设置环境变量
    process.env.IMDB_API_KEY = 'test-api-key';
    
    // 清除所有模拟
    jest.clearAllMocks();
    
    // 重新创建服务实例
    imdbService = require('../services/imdbService');
  });

  afterEach(() => {
    delete process.env.IMDB_API_KEY;
  });

  describe('构造函数', () => {
    test('应该使用正确的API密钥', () => {
      expect(imdbService.apiKey).toBe('test-api-key');
    });

    test('缺少API密钥时应该抛出错误', () => {
      delete process.env.IMDB_API_KEY;
      
      expect(() => {
        require('../services/imdbService');
      }).toThrow('IMDB API密钥未配置');
    });
  });

  describe('searchMovies', () => {
    test('应该成功搜索电影', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 'tt1234567',
              title: '测试电影',
              description: '测试描述',
              image: 'test-image.jpg',
              resultType: 'Movie'
            }
          ]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const result = await imdbService.searchMovies('测试电影');
      
      expect(axios.get).toHaveBeenCalledWith(
        'https://imdb-api.com/API/SearchMovie/test-api-key/%E6%B5%8B%E8%AF%95%E7%94%B5%E5%BD%B1'
      );
      
      expect(result).toEqual([
        {
          id: 'tt1234567',
          title: '测试电影',
          description: '测试描述',
          image: 'test-image.jpg',
          resultType: 'Movie'
        }
      ]);
    });

    test('应该处理API错误', async () => {
      const mockResponse = {
        data: {
          errorMessage: 'API错误'
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      await expect(imdbService.searchMovies('测试电影')).rejects.toThrow('API错误');
    });

    test('应该处理网络错误', async () => {
      const error = new Error('网络错误');
      axios.get.mockRejectedValue(error);
      
      await expect(imdbService.searchMovies('测试电影')).rejects.toThrow('网络错误');
    });

    test('应该处理空结果', async () => {
      const mockResponse = {
        data: {
          results: []
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const result = await imdbService.searchMovies('不存在的电影');
      
      expect(result).toEqual([]);
    });
  });

  describe('getMovieDetails', () => {
    test('应该成功获取电影详情', async () => {
      const mockResponse = {
        data: {
          id: 'tt1234567',
          title: '测试电影',
          originalTitle: 'Test Movie',
          year: '2023',
          plot: '测试剧情',
          image: 'test-poster.jpg',
          imDbRating: '8.5',
          directors: '测试导演',
          stars: '测试演员',
          genres: '动作,冒险',
          runtimeStr: '120 min'
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const result = await imdbService.getMovieDetails('tt1234567');
      
      expect(axios.get).toHaveBeenCalledWith(
        'https://imdb-api.com/API/Title/test-api-key/tt1234567/FullActor,FullCast,Posters,Images,Trailer,Ratings'
      );
      
      expect(result).toEqual({
        id: 'tt1234567',
        title: '测试电影',
        originalTitle: 'Test Movie',
        year: '2023',
        plot: '测试剧情',
        poster: 'test-poster.jpg',
        rating: '8.5',
        director: '测试导演',
        cast: '测试演员',
        genres: '动作,冒险',
        runtime: '120 min'
      });
    });

    test('应该处理API错误', async () => {
      const mockResponse = {
        data: {
          errorMessage: '电影未找到'
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      await expect(imdbService.getMovieDetails('invalid-id')).rejects.toThrow('电影未找到');
    });

    test('应该处理网络错误', async () => {
      const error = new Error('网络错误');
      axios.get.mockRejectedValue(error);
      
      await expect(imdbService.getMovieDetails('tt1234567')).rejects.toThrow('网络错误');
    });
  });

  describe('边界情况', () => {
    test('应该处理特殊字符的电影名称', async () => {
      const mockResponse = {
        data: {
          results: []
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      await imdbService.searchMovies('电影名称 with 特殊字符 & 符号');
      
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('test-api-key')
      );
    });

    test('应该处理空字符串', async () => {
      const mockResponse = {
        data: {
          results: []
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      await imdbService.searchMovies('');
      
      expect(axios.get).toHaveBeenCalledWith(
        'https://imdb-api.com/API/SearchMovie/test-api-key/'
      );
    });
  });
}); 