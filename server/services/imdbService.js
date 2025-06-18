const axios = require('axios');
const logger = require('../utils/logger');

class IMDBService {
  constructor() {
    this.apiKey = process.env.IMDB_API_KEY;
    this.baseUrl = 'https://imdb-api.com/API';
    
    if (!this.apiKey) {
      throw new Error('IMDB API密钥未配置');
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
      
      const response = await axios.get(`${this.baseUrl}/SearchMovie/${this.apiKey}/${encodeURIComponent(query)}`);
      
      if (response.data.errorMessage) {
        throw new Error(response.data.errorMessage);
      }

      const movies = response.data.results || [];
      logger.info(`找到 ${movies.length} 部电影`);
      
      return movies.map(movie => ({
        id: movie.id,
        title: movie.title,
        description: movie.description,
        image: movie.image,
        resultType: movie.resultType
      }));
    } catch (error) {
      logger.error('IMDB搜索失败:', error.message);
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
      
      const response = await axios.get(`${this.baseUrl}/Title/${this.apiKey}/${movieId}/FullActor,FullCast,Posters,Images,Trailer,Ratings`);
      
      if (response.data.errorMessage) {
        throw new Error(response.data.errorMessage);
      }

      const movie = response.data;
      logger.info(`获取到电影详情: ${movie.title}`);
      
      return {
        id: movie.id,
        title: movie.title,
        originalTitle: movie.originalTitle,
        year: movie.year,
        plot: movie.plot,
        poster: movie.image,
        rating: movie.imDbRating,
        director: movie.directors,
        cast: movie.stars,
        genres: movie.genres,
        runtime: movie.runtimeStr
      };
    } catch (error) {
      logger.error('获取电影详情失败:', error.message);
      throw error;
    }
  }
}

module.exports = new IMDBService(); 