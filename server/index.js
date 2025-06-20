require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const movieRoutes = require('./routes/movies');
const subtitleRoutes = require('./routes/subtitles');
const fileWatcher = require('./services/fileWatcher');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet({
  contentSecurityPolicy: false, // 允许Next.js的内联脚本
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// API路由
app.use('/api/movies', movieRoutes);
app.use('/api/subtitles', subtitleRoutes);

// 托管前端静态文件
app.use(express.static(path.join(__dirname, '../client/.next/static'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// 托管前端构建文件
app.use(express.static(path.join(__dirname, '../client/out')));

// 所有其他请求返回前端index.html（SPA路由支持）
app.get('*', (req, res) => {
  // 如果是API请求但没有找到，返回404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: '接口不存在' });
  }

  // 返回前端页面
  res.sendFile(path.join(__dirname, '../client/out/index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`统一服务运行在端口 ${PORT}`);
  logger.info(`访问地址: http://localhost:${PORT}`);

  // 启动文件监控
  if (process.env.MOVIE_WATCH_DIR) {
    fileWatcher.startWatching();
  }
});

module.exports = app; 