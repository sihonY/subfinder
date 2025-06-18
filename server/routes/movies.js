const express = require('express');
const router = express.Router();
const imdbService = require('../services/imdbService');
const logger = require('../utils/logger');

/**
 * 搜索电影
 * GET /api/movies/search?q=电影名称
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }

    logger.info(`用户搜索电影: ${q}`);
    const movies = await imdbService.searchMovies(q.trim());
    
    res.json({
      success: true,
      data: movies,
      count: movies.length
    });
    
  } catch (error) {
    logger.error('电影搜索失败:', error);
    res.status(500).json({ 
      error: '搜索失败',
      message: error.message 
    });
  }
});

/**
 * 获取电影详情
 * GET /api/movies/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: '电影ID不能为空' });
    }

    logger.info(`用户获取电影详情: ${id}`);
    const movieDetails = await imdbService.getMovieDetails(id);
    
    if (!movieDetails) {
      return res.status(404).json({ error: '未找到电影信息' });
    }
    
    res.json({
      success: true,
      data: movieDetails
    });
    
  } catch (error) {
    logger.error('获取电影详情失败:', error);
    res.status(500).json({ 
      error: '获取电影详情失败',
      message: error.message 
    });
  }
});

module.exports = router; 