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
    const { title, year, language = 'zh-CN' } = req.query;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: '电影标题不能为空' });
    }

    logger.info(`用户搜索字幕: ${title} (${year}) - ${language}`);
    const subtitles = await opensubtitlesService.searchSubtitles(title.trim(), year, language);
    
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
    const { subtitleId, fileName, movieTitle } = req.body;
    
    if (!subtitleId || !fileName) {
      return res.status(400).json({ error: '字幕ID和文件名不能为空' });
    }

    logger.info(`用户下载字幕: ${subtitleId} - ${fileName}`);
    
    // 确定下载路径
    const downloadDir = process.env.SUBTITLE_DOWNLOAD_DIR || path.join(__dirname, '../downloads');
    await fs.ensureDir(downloadDir);
    
    const subtitlePath = path.join(downloadDir, fileName);
    
    // 下载字幕
    await opensubtitlesService.downloadSubtitle(subtitleId, subtitlePath);
    
    res.json({
      success: true,
      data: {
        filePath: subtitlePath,
        fileName: fileName,
        size: (await fs.stat(subtitlePath)).size
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

module.exports = router; 