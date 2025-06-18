const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class OpenSubtitlesService {
  constructor() {
    this.apiKey = process.env.OPENSUBTITLES_API_KEY;
    this.userAgent = process.env.OPENSUBTITLES_USER_AGENT;
    this.baseUrl = 'https://api.opensubtitles.com/api/v1';
    
    if (!this.apiKey || !this.userAgent) {
      throw new Error('OpenSubtitles API配置不完整');
    }
  }

  /**
   * 搜索字幕
   * @param {string} movieTitle - 电影标题
   * @param {string} movieYear - 电影年份
   * @param {string} language - 语言代码
   * @returns {Promise<Array>} 字幕列表
   */
  async searchSubtitles(movieTitle, movieYear = null, language = 'zh-CN') {
    try {
      logger.info(`搜索字幕: ${movieTitle} (${movieYear}) - ${language}`);
      
      const params = {
        query: movieTitle,
        languages: language
      };
      
      if (movieYear) {
        params.year = movieYear;
      }

      const response = await axios.get(`${this.baseUrl}/subtitles`, {
        params,
        headers: {
          'Api-Key': this.apiKey,
          'User-Agent': this.userAgent
        }
      });

      const subtitles = response.data.data || [];
      logger.info(`找到 ${subtitles.length} 个字幕文件`);
      
      return subtitles.map(subtitle => ({
        id: subtitle.attributes.files[0].file_id,
        fileName: subtitle.attributes.files[0].file_name,
        language: subtitle.attributes.language,
        downloadCount: subtitle.attributes.download_count,
        rating: subtitle.attributes.ratings,
        release: subtitle.attributes.release,
        format: subtitle.attributes.format,
        size: subtitle.attributes.files[0].file_size
      }));
    } catch (error) {
      logger.error('OpenSubtitles搜索失败:', error.message);
      throw error;
    }
  }

  /**
   * 下载字幕
   * @param {string} subtitleId - 字幕ID
   * @param {string} targetPath - 目标路径
   * @returns {Promise<string>} 下载的文件路径
   */
  async downloadSubtitle(subtitleId, targetPath) {
    try {
      logger.info(`下载字幕: ${subtitleId} 到 ${targetPath}`);
      
      // 获取下载链接
      const downloadResponse = await axios.post(`${this.baseUrl}/download`, {
        file_id: subtitleId
      }, {
        headers: {
          'Api-Key': this.apiKey,
          'User-Agent': this.userAgent
        }
      });

      const downloadUrl = downloadResponse.data.link;
      
      // 下载文件
      const fileResponse = await axios.get(downloadUrl, {
        responseType: 'arraybuffer'
      });

      // 确保目标目录存在
      await fs.ensureDir(path.dirname(targetPath));
      
      // 保存文件
      await fs.writeFile(targetPath, fileResponse.data);
      
      logger.info(`字幕下载完成: ${targetPath}`);
      return targetPath;
    } catch (error) {
      logger.error('字幕下载失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取最佳字幕（按下载量和评分排序）
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

    // 首选语言的字幕
    if (languageGroups[preferredLanguage]) {
      return this.sortByQuality(languageGroups[preferredLanguage])[0];
    }

    // 中文字幕
    const chineseLangs = ['zh-CN', 'zh', 'zh-TW'];
    for (const lang of chineseLangs) {
      if (languageGroups[lang]) {
        return this.sortByQuality(languageGroups[lang])[0];
      }
    }

    // 英语字幕
    if (languageGroups['en']) {
      return this.sortByQuality(languageGroups['en'])[0];
    }

    // 返回第一个可用的字幕
    return this.sortByQuality(subtitles)[0];
  }

  /**
   * 按质量排序字幕（下载量 + 评分）
   * @param {Array} subtitles - 字幕列表
   * @returns {Array} 排序后的字幕列表
   */
  sortByQuality(subtitles) {
    return subtitles.sort((a, b) => {
      const scoreA = (a.downloadCount || 0) + (a.rating || 0) * 100;
      const scoreB = (b.downloadCount || 0) + (b.rating || 0) * 100;
      return scoreB - scoreA;
    });
  }
}

module.exports = new OpenSubtitlesService(); 