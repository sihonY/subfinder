const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const imdbService = require('./imdbService');
const opensubtitlesService = require('./opensubtitlesService');
const deepseekService = require('./deepseekService');

class MovieProcessor {
  constructor() {
    this.preferredLanguages = (process.env.PREFERRED_LANGUAGES || 'zh-CN,zh,en').split(',');
  }

  /**
   * 处理电影文件
   * @param {string} movieFilePath - 电影文件路径
   */
  async processMovieFile(movieFilePath) {
    try {
      logger.info(`开始处理电影文件: ${movieFilePath}`);
      
      // 1. 提取电影名称
      const movieName = await this.extractMovieName(movieFilePath);
      logger.info(`提取的电影名称: ${movieName}`);
      
      // 2. 搜索电影信息
      const movieInfo = await this.searchMovieInfo(movieName);
      if (!movieInfo) {
        logger.warn(`未找到电影信息: ${movieName}`);
        return;
      }
      
      // 3. 搜索字幕
      const subtitles = await this.searchSubtitles(movieInfo);
      if (!subtitles || subtitles.length === 0) {
        logger.warn(`未找到字幕: ${movieName}`);
        return;
      }
      
      // 4. 下载最佳字幕
      await this.downloadBestSubtitle(subtitles, movieFilePath, movieInfo);
      
      logger.info(`电影处理完成: ${movieName}`);
      
    } catch (error) {
      logger.error(`处理电影文件失败: ${movieFilePath}`, error);
    }
  }

  /**
   * 从文件路径提取电影名称
   * @param {string} movieFilePath - 电影文件路径
   * @returns {Promise<string>} 电影名称
   */
  async extractMovieName(movieFilePath) {
    try {
      // 获取目录中最大的视频文件
      const dirPath = path.dirname(movieFilePath);
      const files = await fs.readdir(dirPath);
      
      let largestVideoFile = null;
      let maxSize = 0;
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile() && this.isVideoFile(filePath) && stat.size > maxSize) {
          largestVideoFile = file;
          maxSize = stat.size;
        }
      }
      
      if (!largestVideoFile) {
        throw new Error('未找到视频文件');
      }
      
      // 提取文件名（不含扩展名）
      const fileName = path.parse(largestVideoFile).name;
      
      // 尝试直接搜索
      try {
        const movies = await imdbService.searchMovies(fileName);
        if (movies && movies.length > 0) {
          return fileName;
        }
      } catch (error) {
        logger.debug(`直接搜索失败，尝试AI简化: ${fileName}`);
      }
      
      // 使用AI简化文件名
      const simplifiedName = await deepseekService.simplifyMovieName(fileName);
      return simplifiedName;
      
    } catch (error) {
      logger.error('提取电影名称失败:', error);
      throw error;
    }
  }

  /**
   * 搜索电影信息
   * @param {string} movieName - 电影名称
   * @returns {Promise<Object|null>} 电影信息
   */
  async searchMovieInfo(movieName) {
    try {
      const movies = await imdbService.searchMovies(movieName);
      
      if (!movies || movies.length === 0) {
        return null;
      }
      
      // 获取第一个电影的详细信息
      const movieDetails = await imdbService.getMovieDetails(movies[0].id);
      return movieDetails;
      
    } catch (error) {
      logger.error('搜索电影信息失败:', error);
      return null;
    }
  }

  /**
   * 搜索字幕
   * @param {Object} movieInfo - 电影信息
   * @returns {Promise<Array>} 字幕列表
   */
  async searchSubtitles(movieInfo) {
    try {
      const allSubtitles = [];
      
      // 按优先级搜索不同语言的字幕
      for (const language of this.preferredLanguages) {
        try {
          const subtitles = await opensubtitlesService.searchSubtitles(
            movieInfo.title,
            movieInfo.year,
            language
          );
          
          if (subtitles && subtitles.length > 0) {
            allSubtitles.push(...subtitles);
          }
        } catch (error) {
          logger.debug(`搜索${language}字幕失败:`, error.message);
        }
      }
      
      return allSubtitles;
      
    } catch (error) {
      logger.error('搜索字幕失败:', error);
      return [];
    }
  }

  /**
   * 下载最佳字幕
   * @param {Array} subtitles - 字幕列表
   * @param {string} movieFilePath - 电影文件路径
   * @param {Object} movieInfo - 电影信息
   */
  async downloadBestSubtitle(subtitles, movieFilePath, movieInfo) {
    try {
      // 获取最佳字幕
      const bestSubtitle = opensubtitlesService.getBestSubtitle(subtitles, this.preferredLanguages[0]);
      
      if (!bestSubtitle) {
        logger.warn('未找到合适的字幕');
        return;
      }
      
      // 确定下载路径
      const movieDir = path.dirname(movieFilePath);
      const movieName = path.parse(movieFilePath).name;
      const subtitleExt = path.extname(bestSubtitle.fileName);
      const subtitlePath = path.join(movieDir, `${movieName}${subtitleExt}`);
      
      // 下载字幕
      await opensubtitlesService.downloadSubtitle(bestSubtitle.id, subtitlePath);
      
      // 如果是英语字幕且不是首选语言，尝试翻译
      if (bestSubtitle.language === 'en' && !this.preferredLanguages.includes('en')) {
        await this.translateSubtitle(subtitlePath);
      }
      
      logger.info(`字幕下载完成: ${subtitlePath}`);
      
    } catch (error) {
      logger.error('下载字幕失败:', error);
    }
  }

  /**
   * 翻译字幕文件
   * @param {string} subtitlePath - 字幕文件路径
   */
  async translateSubtitle(subtitlePath) {
    try {
      logger.info(`开始翻译字幕: ${subtitlePath}`);
      
      // 读取字幕内容
      const subtitleContent = await fs.readFile(subtitlePath, 'utf-8');
      
      // 翻译字幕
      const translatedContent = await deepseekService.translateSubtitle(subtitleContent, 'zh-CN');
      
      // 保存翻译后的字幕
      const translatedPath = subtitlePath.replace(/\.(srt|ass|ssa)$/i, '.zh-CN.$1');
      await fs.writeFile(translatedPath, translatedContent);
      
      logger.info(`字幕翻译完成: ${translatedPath}`);
      
    } catch (error) {
      logger.error('翻译字幕失败:', error);
    }
  }

  /**
   * 检查是否为视频文件
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否为视频文件
   */
  isVideoFile(filePath) {
    const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
    const ext = path.extname(filePath).toLowerCase();
    return videoExtensions.includes(ext);
  }
}

module.exports = new MovieProcessor(); 