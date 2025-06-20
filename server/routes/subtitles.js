const express = require('express');
const router = express.Router();
const opensubtitlesService = require('../services/opensubtitlesService');
const deepseekService = require('../services/deepseekService');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

/**
 * 搜索字幕
 * GET /api/subtitles/search?title=电影标题&year=年份&language=语言
 */
router.get('/search', async (req, res) => {
  try {
    let { tmdbId, title, year, language = 'zh-CN' } = req.query;
    if ((!tmdbId || tmdbId.trim().length === 0) && (!title || title.trim().length === 0)) {
      return res.status(400).json({ error: '电影ID和标题不能同时为空' });
    }
    // 只在tmdbId为纯数字时才作为movieId传递，否则传null
    tmdbId = tmdbId && /^\d+$/.test(tmdbId) ? tmdbId : null;
    logger.info(`用户搜索字幕: tmdbId=${tmdbId}, title=${title} (${year}) - ${language}`);
    const subtitles = await opensubtitlesService.searchSubtitles(tmdbId, title ? title.trim() : '', year, language);
    res.json({
      success: true,
      data: subtitles,
      count: subtitles.length
    });
  } catch (error) {
    logger.error('字幕搜索失败:', error);
    res.status(500).json({
      error: '搜索失败',
      message: error.message
    });
  }
});

/**
 * 下载字幕
 * POST /api/subtitles/download
 */
router.post('/download', async (req, res) => {
  try {
    const { subtitleId, fileName, movieTitle, savePath } = req.body;

    if (!subtitleId || !fileName) {
      return res.status(400).json({ error: '字幕ID和文件名不能为空' });
    }

    logger.info(`用户下载字幕: ${subtitleId} - ${fileName}${savePath ? ` 到目录: ${savePath}` : ''}`);

    // 确定下载路径
    let downloadDir;
    if (savePath) {
      // 用户指定路径，需要验证是否在监控目录范围内
      const movieWatchDir = process.env.MOVIE_WATCH_DIR;
      if (movieWatchDir && savePath.startsWith(movieWatchDir)) {
        downloadDir = savePath;
      } else {
        return res.status(400).json({ error: '指定的保存路径不在允许的范围内' });
      }
    } else {
      // 默认路径
      downloadDir = process.env.SUBTITLE_DOWNLOAD_DIR || path.join(__dirname, '../downloads');
    }

    await fs.ensureDir(downloadDir);
    const subtitlePath = path.join(downloadDir, fileName);

    // 下载字幕
    const actualFilePath = await opensubtitlesService.downloadSubtitle(subtitleId, subtitlePath);

    res.json({
      success: true,
      data: {
        filePath: actualFilePath,
        fileName: path.basename(actualFilePath),
        size: (await fs.stat(actualFilePath)).size,
        directory: downloadDir
      }
    });

  } catch (error) {
    logger.error('字幕下载失败:', error);
    res.status(500).json({
      error: '下载失败',
      message: error.message
    });
  }
});

/**
 * 翻译字幕
 * POST /api/subtitles/translate
 */
router.post('/translate', async (req, res) => {
  try {
    const { subtitleContent, targetLanguage = 'zh-CN' } = req.body;

    if (!subtitleContent) {
      return res.status(400).json({ error: '字幕内容不能为空' });
    }

    logger.info(`用户翻译字幕到 ${targetLanguage}`);

    // 翻译字幕
    const translatedContent = await deepseekService.translateSubtitle(subtitleContent, targetLanguage);

    res.json({
      success: true,
      data: {
        translatedContent,
        targetLanguage
      }
    });

  } catch (error) {
    logger.error('字幕翻译失败:', error);
    res.status(500).json({
      error: '翻译失败',
      message: error.message
    });
  }
});

/**
 * 获取下载历史
 * GET /api/subtitles/history
 */
router.get('/history', async (req, res) => {
  try {
    const downloadDir = process.env.SUBTITLE_DOWNLOAD_DIR || path.join(__dirname, '../downloads');

    if (!fs.existsSync(downloadDir)) {
      return res.json({
        success: true,
        data: []
      });
    }

    const files = await fs.readdir(downloadDir);
    const history = [];

    for (const file of files) {
      const filePath = path.join(downloadDir, file);
      const stat = await fs.stat(filePath);

      if (stat.isFile()) {
        history.push({
          fileName: file,
          filePath: filePath,
          size: stat.size,
          downloadTime: stat.mtime,
          downloadDate: stat.mtime.toISOString()
        });
      }
    }

    // 按下载时间倒序排列
    history.sort((a, b) => new Date(b.downloadTime) - new Date(a.downloadTime));

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    logger.error('获取下载历史失败:', error);
    res.status(500).json({
      error: '获取历史失败',
      message: error.message
    });
  }
});

/**
 * 获取可用的下载目录列表
 * GET /api/subtitles/directories
 */
router.get('/directories', async (req, res) => {
  try {
    const movieWatchDir = process.env.MOVIE_WATCH_DIR;

    if (!movieWatchDir) {
      return res.status(500).json({ error: '电影监控目录未配置' });
    }

    if (!fs.existsSync(movieWatchDir)) {
      return res.status(500).json({ error: '电影监控目录不存在' });
    }

    const directories = [];
    const items = await fs.readdir(movieWatchDir);

    for (const item of items) {
      const itemPath = path.join(movieWatchDir, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        directories.push({
          name: item,
          path: itemPath,
          relativePath: item
        });
      }
    }

    // 按名称排序
    directories.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: directories,
      count: directories.length
    });

  } catch (error) {
    logger.error('获取目录列表失败:', error);
    res.status(500).json({
      error: '获取目录列表失败',
      message: error.message
    });
  }
});

module.exports = router; 