const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const logger = require('../utils/logger');

class TMDBService {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.baseUrl = 'https://api.tmdb.org/3';

    // 配置axios实例
    this.axiosInstance = axios.create({
      timeout: 30000, // 30秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // 配置SOCKS代理（如果环境变量中有设置）
    if (process.env.USE_SOCKS_PROXY === 'true' || process.env.SOCKS_PROXY_HOST) {
      const socksHost = process.env.SOCKS_PROXY_HOST || '127.0.0.1';
      const socksPort = process.env.SOCKS_PROXY_PORT || '10808';
      const socksAgent = new SocksProxyAgent(`socks5://${socksHost}:${socksPort}`);

      this.axiosInstance.defaults.httpsAgent = socksAgent;
      logger.info(`配置SOCKS代理: socks5://${socksHost}:${socksPort}`);
    } else if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
      // 保留原有的HTTP代理配置作为备选
      this.axiosInstance.defaults.proxy = {
        host: process.env.PROXY_HOST || '127.0.0.1',
        port: parseInt(process.env.PROXY_PORT) || 10809,
        protocol: process.env.PROXY_PROTOCOL || 'http'
      };
      logger.info(`配置HTTP代理: ${process.env.PROXY_PROTOCOL || 'http'}://${process.env.PROXY_HOST || '127.0.0.1'}:${process.env.PROXY_PORT || 10809}`);
    }

    if (!this.apiKey) {
      throw new Error('TMDB API密钥未配置');
    }
  }

  /**
   * 搜索电影
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array>} 电影列表
   */
  async searchMovies(query) {
    try {
      logger.info(`搜索电影: ${query}`);

      const response = await this.axiosInstance.get(`${this.baseUrl}/search/movie`, {
        params: {
          api_key: this.apiKey,
          language: 'zh-CN',
          query: query,
          include_adult: false,
          page: 1
        }
      });

      const movies = response.data.results || [];
      logger.info(`找到 ${movies.length} 部电影`);

      return movies.map(movie => ({
        id: movie.id.toString(),
        title: movie.title,
        originalTitle: movie.original_title,
        description: movie.overview,
        image: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : null,
        year: movie.release_date ? movie.release_date.split('-')[0] : null,
        rating: movie.vote_average,
        resultType: 'Movie'
      }));
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        logger.error('TMDB搜索超时，请检查网络连接或代理配置');
      } else if (error.code === 'ECONNREFUSED') {
        logger.error('TMDB连接被拒绝，请检查代理配置');
      } else {
        logger.error('TMDB搜索失败:', error.message);
      }
      throw error;
    }
  }

  /**
   * 获取电影详情
   * @param {string} movieId - 电影ID
   * @returns {Promise<Object>} 电影详情
   */
  async getMovieDetails(movieId) {
    try {
      logger.info(`获取电影详情: ${movieId}`);

      const response = await this.axiosInstance.get(`${this.baseUrl}/movie/${movieId}`, {
        params: {
          api_key: this.apiKey,
          language: 'zh-CN',
          append_to_response: 'credits,images'
        }
      });

      const movie = response.data;
      logger.info(`获取到电影详情: ${movie.title}`);

      return {
        id: movie.id.toString(),
        title: movie.title,
        originalTitle: movie.original_title,
        year: movie.release_date ? movie.release_date.split('-')[0] : null,
        plot: movie.overview,
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : null,
        rating: movie.vote_average,
        director: movie.credits?.crew?.find(person => person.job === 'Director')?.name || '',
        cast: movie.credits?.cast?.slice(0, 5).map(person => person.name).join(', ') || '',
        genres: movie.genres?.map(genre => genre.name).join(', ') || '',
        runtime: movie.runtime ? `${movie.runtime} min` : null
      };
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        logger.error('获取电影详情超时，请检查网络连接或代理配置');
      } else if (error.code === 'ECONNREFUSED') {
        logger.error('获取电影详情连接被拒绝，请检查代理配置');
      } else {
        logger.error('获取电影详情失败:', error.message);
      }
      throw error;
    }
  }
}

module.exports = new TMDBService(); 