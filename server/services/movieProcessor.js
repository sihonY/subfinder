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

      // 1. 提取电影名称（直接使用文件名，不扫描目录）
      const movieName = await this.extractMovieNameFromFile(movieFilePath);
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
   * 从文件名提取电影名称（不扫描目录）
   * @param {string} movieFilePath - 电影文件路径
   * @returns {Promise<string>} 电影名称
   */
  async extractMovieNameFromFile(movieFilePath) {
    try {
      // 直接使用文件名（不含扩展名）
      const fileName = path.parse(movieFilePath).name;
      logger.info(`从文件名提取: ${fileName}`);

      // 尝试直接搜索
      try {
        const movies = await imdbService.searchMovies(fileName);
        if (movies && movies.length > 0) {
          logger.info(`直接搜索成功，使用文件名: ${fileName}`);
          return fileName;
        }
      } catch (error) {
        logger.debug(`直接搜索失败，尝试AI简化: ${fileName}`);
      }

      // 使用AI简化文件名
      const simplifiedName = await deepseekService.simplifyMovieName(fileName);
      logger.info(`AI简化后的文件名: ${simplifiedName}`);
      return simplifiedName;

    } catch (error) {
      logger.error('从文件名提取电影名称失败:', error);
      throw error;
    }
  }

  /**
   * 从文件路径提取电影名称（扫描目录选择最大文件）
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

      logger.info(`扫描目录: ${dirPath}`);
      logger.info(`目录中的文件: ${files.join(', ')}`);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isFile() && this.isVideoFile(filePath)) {
          // 排除样片文件
          const fileName = file.toLowerCase();
          if (this.isSampleFile(fileName)) {
            logger.info(`跳过样片文件: ${file}`);
            continue;
          }

          logger.info(`发现视频文件: ${file} (大小: ${(stat.size / 1024 / 1024).toFixed(2)} MB)`);

          if (stat.size > maxSize) {
            largestVideoFile = file;
            maxSize = stat.size;
            logger.info(`更新最大视频文件: ${file} (大小: ${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
          }
        }
      }

      if (!largestVideoFile) {
        throw new Error('未找到合适的视频文件');
      }

      logger.info(`选择的最大视频文件: ${largestVideoFile} (大小: ${(maxSize / 1024 / 1024).toFixed(2)} MB)`);

      // 提取文件名（不含扩展名）
      const fileName = path.parse(largestVideoFile).name;

      // 尝试直接搜索
      try {
        const movies = await imdbService.searchMovies(fileName);
        if (movies && movies.length > 0) {
          logger.info(`直接搜索成功，使用文件名: ${fileName}`);
          return fileName;
        }
      } catch (error) {
        logger.debug(`直接搜索失败，尝试AI简化: ${fileName}`);
      }

      // 使用AI简化文件名
      const simplifiedName = await deepseekService.simplifyMovieName(fileName);
      logger.info(`AI简化后的文件名: ${simplifiedName}`);
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
      logger.info(`开始搜索字幕: ${movieInfo.title} (ID: ${movieInfo.id}, 年份: ${movieInfo.year})`);
      logger.info(`首选语言顺序: ${this.preferredLanguages.join(', ')}`);

      // 按优先级搜索不同语言的字幕，找到结果就停止
      for (const language of this.preferredLanguages) {
        try {
          logger.info(`=== 尝试搜索 ${language} 字幕 ===`);
          logger.info(`调用参数: movieId=${movieInfo.id}, title=${movieInfo.title}, year=${movieInfo.year}, language=${language}`);

          const subtitles = await opensubtitlesService.searchSubtitles(
            movieInfo.id, // 电影ID
            movieInfo.title, // 电影标题（备选）
            movieInfo.year, // 年份（备选）
            language
          );

          logger.info(`搜索 ${language} 字幕结果: ${subtitles ? subtitles.length : 0} 个字幕`);

          if (subtitles && subtitles.length > 0) {
            logger.info(`找到 ${subtitles.length} 个 ${language} 字幕，停止搜索`);
            logger.info(`第一个字幕信息:`, JSON.stringify(subtitles[0], null, 2));
            return subtitles; // 找到结果就返回，不再搜索其他语言
          } else {
            logger.info(`未找到 ${language} 字幕，尝试下一个语言`);
          }
        } catch (error) {
          logger.warn(`搜索 ${language} 字幕失败:`, error.message);
          logger.warn(`错误详情:`, error.stack);
          // 继续尝试下一个语言
        }
      }

      logger.warn(`所有语言都未找到字幕: ${movieInfo.title}`);
      return [];

    } catch (error) {
      logger.error('搜索字幕失败:', error);
      return [];
    }
  }

  /**
   * 检查目录中是否已存在字幕文件
   * @param {string} movieDir - 电影目录
   * @param {string} movieName - 电影名称
   * @returns {Promise<boolean>} 是否存在字幕文件
   */
  async checkSubtitleExists(movieDir, movieName) {
    try {
      const files = await fs.readdir(movieDir);
      const subtitleExtensions = ['.srt', '.ass', '.ssa', '.sub', '.vtt'];

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (subtitleExtensions.includes(ext)) {
          // 检查文件名是否包含电影名称（忽略大小写）
          const fileName = path.parse(file).name.toLowerCase();
          const movieNameLower = movieName.toLowerCase();

          // 检查是否匹配电影名称
          if (fileName.includes(movieNameLower) || movieNameLower.includes(fileName)) {
            logger.info(`发现已存在的字幕文件: ${file}`);
            return true;
          }

          // 检查是否有中文标识的字幕文件
          if (fileName.includes('chinese') || fileName.includes('zh') || fileName.includes('cn')) {
            logger.info(`发现已存在的中文字幕文件: ${file}`);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.error('检查字幕文件存在性失败:', error);
      return false;
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

      // 检查是否已存在字幕文件
      const subtitleExists = await this.checkSubtitleExists(movieDir, movieName);
      if (subtitleExists) {
        logger.info(`跳过下载，目录中已存在字幕文件: ${movieName}`);
        return;
      }

      // 检查目标文件是否已存在
      if (await fs.pathExists(subtitlePath)) {
        logger.info(`跳过下载，目标字幕文件已存在: ${subtitlePath}`);
        return;
      }

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

  /**
   * 检查是否为字幕文件
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否为字幕文件
   */
  isSubtitleFile(filePath) {
    const subtitleExtensions = ['.srt', '.ass', '.ssa', '.sub', '.vtt'];
    const ext = path.extname(filePath).toLowerCase();
    return subtitleExtensions.includes(ext);
  }

  /**
   * 检查是否为样片文件
   * @param {string} fileName - 文件名
   * @returns {boolean} 是否为样片文件
   */
  isSampleFile(fileName) {
    const fileNameLower = fileName.toLowerCase();

    // 样片关键词
    const sampleKeywords = [
      'sample', 'trailer', 'preview', 'teaser', 'promo',
      'sample.', 'trailer.', 'preview.', 'teaser.', 'promo.',
      'sample.mp4', 'trailer.mp4', 'preview.mp4', 'teaser.mp4', 'promo.mp4',
      'sample.mkv', 'trailer.mkv', 'preview.mkv', 'teaser.mkv', 'promo.mkv',
      'sample.avi', 'trailer.avi', 'preview.avi', 'teaser.avi', 'promo.avi'
    ];

    // 检查是否包含样片关键词
    for (const keyword of sampleKeywords) {
      if (fileNameLower.includes(keyword)) {
        return true;
      }
    }

    // 检查文件大小（如果文件名中包含大小信息，通常样片文件较小）
    const sizeMatch = fileNameLower.match(/(\d+)\s*(mb|gb)/i);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      const unit = sizeMatch[2].toLowerCase();

      // 如果文件大小小于50MB，可能是样片
      if (unit === 'mb' && size < 50) {
        return true;
      }
      // 如果文件大小小于0.1GB，可能是样片
      if (unit === 'gb' && size < 0.1) {
        return true;
      }
    }

    return false;
  }
}

module.exports = new MovieProcessor(); 