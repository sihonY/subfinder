const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class OpenSubtitlesService {
  constructor() {
    this.apiKey = process.env.OPENSUBTITLES_API_KEY;
    this.userAgent = process.env.OPENSUBTITLES_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.username = process.env.OPENSUBTITLES_USERNAME;
    this.password = process.env.OPENSUBTITLES_PASSWORD;
    this.token = null; // 登录token
    this.tokenDate = null; // token获取日期（YYYY-MM-DD格式）

    if (!this.apiKey) {
      throw new Error('OpenSubtitles API密钥未配置');
    }

    // 配置axios实例
    this.axiosInstance = axios.create({
      timeout: 30000, // 30秒超时
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Api-Key': this.apiKey,
        'User-Agent': this.userAgent
      }
    });

    // 配置代理（如果环境变量中有设置）
    if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
      this.axiosInstance.defaults.proxy = {
        host: process.env.PROXY_HOST || '127.0.0.1',
        port: parseInt(process.env.PROXY_PORT) || 7890,
        protocol: process.env.PROXY_PROTOCOL || 'http'
      };
      logger.info(`OpenSubtitles配置代理: ${process.env.PROXY_PROTOCOL || 'http'}://${process.env.PROXY_HOST || '127.0.0.1'}:${process.env.PROXY_PORT || 7890}`);
    }
  }

  /**
   * 检查token是否仍然有效（同一天内有效）
   */
  isTokenValid() {
    if (!this.token || !this.tokenDate) {
      return false;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
    return this.tokenDate === today;
  }

  /**
   * 登录OpenSubtitles，获取token
   */
  async login() {
    /* // 暂时屏蔽登录逻辑，硬编码token用于测试
    this.token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0TkYycDVVbVpJQ0N1SzE3dzd6UmoyR0dVYk91S1VScSIsImV4cCI6MTc1MDMyMTI2Mn0.AchHVLKkRR4Z6FMzF06f8-cBq8o3pr9sH-Uybu6EEMU';
    logger.info('OpenSubtitles使用硬编码token（测试用）');
    return this.token;
    */
    //* 原登录逻辑暂时注释
    if (!this.username || !this.password) {
      throw new Error('OpenSubtitles账号或密码未配置');
    }
    logger.info('OpenSubtitles登录中...');
    try {
      const response = await this.axiosInstance.post('https://api.opensubtitles.com/api/v1/login', {
        username: this.username,
        password: this.password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Api-Key': this.apiKey,
          'User-Agent': this.userAgent
        }
      });
      this.token = response.data.token;
      this.tokenDate = new Date().toISOString().split('T')[0]; // 记录获取token的日期
      logger.info(`OpenSubtitles登录成功，token缓存至: ${this.tokenDate}`);
      return this.token;
    } catch (error) {
      logger.error('OpenSubtitles登录失败:', error.message);
      throw error;
    }
    //*/
  }

  /**
   * 获取有效token（智能缓存管理）
   */
  async getToken() {
    // 如果token仍然有效（同一天内），直接返回
    if (this.isTokenValid()) {
      logger.info(`使用缓存的token（${this.tokenDate}）`);
      return this.token;
    }

    // token无效或过期，重新登录
    logger.info('token已过期或不存在，重新登录...');
    return await this.login();
  }

  /**
   * 搜索字幕（使用电影ID）
   * @param {string} movieId - TMDB电影ID
   * @param {string} language - 语言代码
   * @returns {Promise<Array>} 字幕列表
   */
  async searchSubtitlesByMovieId(movieId, language = 'zh-CN') {
    try {
      logger.info(`通过电影ID搜索字幕: ${movieId} [${language}]`);

      const response = await this.axiosInstance.get('https://api.opensubtitles.com/api/v1/subtitles', {
        params: {
          tmdb_id: movieId,
          languages: language
        }
      });

      const subtitles = response.data.data || [];
      logger.info(`找到 ${subtitles.length} 个字幕`);

      return subtitles.map(subtitle => ({
        id: subtitle.attributes.files[0]?.file_id,
        fileName: subtitle.attributes.files[0]?.file_name,
        language: subtitle.attributes.language,
        downloadCount: subtitle.attributes.download_count || subtitle.attributes.new_download_count || 0,
        rating: subtitle.attributes.ratings || 0,
        release: subtitle.attributes.release,
        format: subtitle.attributes.format,
        size: subtitle.attributes.files[0]?.file_size,
        subtitleId: subtitle.attributes.subtitle_id,
        uploadDate: subtitle.attributes.upload_date,
        hd: subtitle.attributes.hd,
        fps: subtitle.attributes.fps,
        comments: subtitle.attributes.comments,
        aiTranslated: subtitle.attributes.ai_translated,
        machineTranslated: subtitle.attributes.machine_translated
      }));
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        logger.error('OpenSubtitles搜索超时，请检查网络连接或代理配置');
      } else if (error.code === 'ECONNREFUSED') {
        logger.error('OpenSubtitles连接被拒绝，请检查代理配置');
      } else {
        logger.error('OpenSubtitles搜索失败:', error.message);
      }
      throw error;
    }
  }

  /**
   * 搜索字幕（使用电影标题，作为备选方案）
   * @param {string} title - 电影标题
   * @param {string} year - 年份
   * @param {string} language - 语言代码
   * @returns {Promise<Array>} 字幕列表
   */
  async searchSubtitlesByTitle(title, year = '', language = 'zh-CN') {
    try {
      logger.info(`通过标题搜索字幕: ${title} (${year}) [${language}]`);

      const response = await this.axiosInstance.get('https://api.opensubtitles.com/api/v1/subtitles', {
        params: {
          query: title,
          year: year,
          languages: language
        }
      });

      const subtitles = response.data.data || [];
      logger.info(`找到 ${subtitles.length} 个字幕`);

      return subtitles.map(subtitle => ({
        id: subtitle.attributes.files[0]?.file_id,
        fileName: subtitle.attributes.files[0]?.file_name,
        language: subtitle.attributes.language,
        downloadCount: subtitle.attributes.download_count || subtitle.attributes.new_download_count || 0,
        rating: subtitle.attributes.ratings || 0,
        release: subtitle.attributes.release,
        format: subtitle.attributes.format,
        size: subtitle.attributes.files[0]?.file_size,
        subtitleId: subtitle.attributes.subtitle_id,
        uploadDate: subtitle.attributes.upload_date,
        hd: subtitle.attributes.hd,
        fps: subtitle.attributes.fps,
        comments: subtitle.attributes.comments,
        aiTranslated: subtitle.attributes.ai_translated,
        machineTranslated: subtitle.attributes.machine_translated
      }));
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        logger.error('OpenSubtitles搜索超时，请检查网络连接或代理配置');
      } else if (error.code === 'ECONNREFUSED') {
        logger.error('OpenSubtitles连接被拒绝，请检查代理配置');
      } else {
        logger.error('OpenSubtitles搜索失败:', error.message);
      }
      throw error;
    }
  }

  /**
   * 搜索字幕（主要方法，优先使用电影ID）
   * @param {string} movieId - TMDB电影ID
   * @param {string} title - 电影标题（备选）
   * @param {string} year - 年份（备选）
   * @param {string} language - 语言代码
   * @returns {Promise<Array>} 字幕列表
   */
  async searchSubtitles(movieId, title = '', year = '', language = 'zh-CN') {
    try {
      logger.info(`开始搜索字幕 - 电影ID: ${movieId}, 标题: ${title}, 年份: ${year}, 语言: ${language}`);

      // 优先使用电影ID搜索
      if (movieId) {
        logger.info(`尝试通过电影ID搜索: ${movieId}`);
        const subtitles = await this.searchSubtitlesByMovieId(movieId, language);
        logger.info(`电影ID搜索结果: ${subtitles ? subtitles.length : 0} 个字幕`);

        if (subtitles && subtitles.length > 0) {
          logger.info(`通过电影ID找到字幕，返回结果`);
          return subtitles;
        }
        logger.info(`通过电影ID未找到字幕，尝试使用标题搜索`);
      }

      // 如果电影ID搜索失败或没有结果，使用标题搜索
      if (title) {
        logger.info(`尝试通过标题搜索: ${title} (${year})`);
        const subtitles = await this.searchSubtitlesByTitle(title, year, language);
        logger.info(`标题搜索结果: ${subtitles ? subtitles.length : 0} 个字幕`);
        return subtitles;
      }

      logger.warn(`没有提供电影ID或标题，无法搜索字幕`);
      return [];
    } catch (error) {
      logger.error('字幕搜索失败:', error.message);
      throw error;
    }
  }

  /**
   * 下载字幕
   * @param {string} subtitleId - 字幕ID
   * @param {string} filePath - 保存路径
   * @returns {Promise<string>} 保存的文件路径
   */
  async downloadSubtitle(subtitleId, filePath) {
    try {
      logger.info(`下载字幕: ${subtitleId}`);

      // 获取token
      const token = await this.getToken();

      // 获取下载链接（带Api-Key、User-Agent、Authorization）
      const downloadResponse = await this.axiosInstance.post('https://api.opensubtitles.com/api/v1/download', {
        file_id: subtitleId,
        force_download: 1
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const downloadUrl = downloadResponse.data.link;
      if (!downloadUrl) {
        throw new Error('未获取到下载链接');
      }

      logger.info(`获取到下载链接: ${downloadUrl}`);

      // 从下载链接中提取实际的文件名（包含后缀）
      let actualFileName = path.basename(filePath); // 默认使用原文件名
      try {
        const url = new URL(downloadUrl);
        const urlFileName = path.basename(url.pathname);
        if (urlFileName && urlFileName !== '') {
          actualFileName = decodeURIComponent(urlFileName);
          logger.info(`从下载链接提取到实际文件名: ${actualFileName}`);
        }
      } catch (error) {
        logger.warn('无法从下载链接提取文件名，使用原始文件名');
      }

      // 使用实际文件名构建最终保存路径
      const finalFilePath = path.join(path.dirname(filePath), actualFileName);

      // 下载字幕文件（使用配置好代理的实例，只带User-Agent，不带Api-Key和token）
      const fileResponse = await this.axiosInstance.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: {
          'User-Agent': this.userAgent
        }
      });

      // 确保目录存在
      const dir = path.dirname(finalFilePath);
      await fs.ensureDir(dir);

      // 保存文件
      await fs.writeFile(finalFilePath, fileResponse.data);
      logger.info(`字幕下载完成: ${finalFilePath}`);

      return finalFilePath;
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        logger.error('字幕下载超时，请检查网络连接或代理配置');
      } else if (error.code === 'ECONNREFUSED') {
        logger.error('字幕下载连接被拒绝，请检查代理配置');
      } else {
        logger.error('字幕下载失败:', error.message);
      }
      throw error;
    }
  }

  /**
   * 获取最佳字幕
   * @param {Array} subtitles - 字幕列表
   * @param {string} preferredLanguage - 首选语言
   * @returns {Object|null} 最佳字幕
   */
  getBestSubtitle(subtitles, preferredLanguage = 'zh-CN') {
    if (!subtitles || subtitles.length === 0) {
      return null;
    }

    // 按语言分组
    const languageGroups = {};
    subtitles.forEach(subtitle => {
      const lang = subtitle.language;
      if (!languageGroups[lang]) {
        languageGroups[lang] = [];
      }
      languageGroups[lang].push(subtitle);
    });

    // 按优先级查找语言
    const languagePriority = [
      preferredLanguage,
      'zh-CN',
      'zh',
      'en'
    ];

    for (const lang of languagePriority) {
      if (languageGroups[lang]) {
        // 按质量排序
        const sortedSubtitles = this.sortByQuality(languageGroups[lang]);
        return sortedSubtitles[0];
      }
    }

    // 如果没有找到首选语言，返回第一个
    return this.sortByQuality(subtitles)[0];
  }

  /**
   * 按质量排序字幕
   * @param {Array} subtitles - 字幕列表
   * @returns {Array} 排序后的字幕列表
   */
  sortByQuality(subtitles) {
    return subtitles.sort((a, b) => {
      // 优先选择非AI翻译的字幕
      if (a.aiTranslated && !b.aiTranslated) return 1;
      if (!a.aiTranslated && b.aiTranslated) return -1;

      // 优先选择非机器翻译的字幕
      if (a.machineTranslated && !b.machineTranslated) return 1;
      if (!a.machineTranslated && b.machineTranslated) return -1;

      // 优先选择HD字幕
      if (a.hd && !b.hd) return -1;
      if (!a.hd && b.hd) return 1;

      // 计算质量分数 (下载量 * 评分)
      const scoreA = (a.downloadCount || 0) * (a.rating || 1);
      const scoreB = (b.downloadCount || 0) * (b.rating || 1);

      // 如果分数相同，优先选择较新的字幕
      if (scoreA === scoreB) {
        const dateA = new Date(a.uploadDate || 0);
        const dateB = new Date(b.uploadDate || 0);
        return dateB - dateA;
      }

      return scoreB - scoreA;
    });
  }
}

module.exports = new OpenSubtitlesService(); 