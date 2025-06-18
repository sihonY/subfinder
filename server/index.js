require('dotenv').config();
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
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use('/api/movies', movieRoutes);
app.use('/api/subtitles', subtitleRoutes);

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
  logger.info(`服务器运行在端口 ${PORT}`);
  
  // 启动文件监控
  if (process.env.MOVIE_WATCH_DIR) {
    fileWatcher.startWatching();
  }
});

module.exports = app; 