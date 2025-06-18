const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const movieProcessor = require('./movieProcessor');

class FileWatcher {
  constructor() {
    this.watchDir = process.env.MOVIE_WATCH_DIR;
    this.watcher = null;
    this.isWatching = false;
    this.processedFiles = new Set();
  }

  /**
   * 启动文件监控
   */
  startWatching() {
    if (!this.watchDir || !fs.existsSync(this.watchDir)) {
      logger.warn(`监控目录不存在: ${this.watchDir}`);
      return;
    }

    if (this.isWatching) {
      logger.warn('文件监控已在运行中');
      return;
    }

    logger.info(`开始监控目录: ${this.watchDir}`);

    this.watcher = chokidar.watch(this.watchDir, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      depth: 2, // 监控2层目录深度
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    // 监听新文件添加
    this.watcher.on('add', (filePath) => {
      this.handleNewFile(filePath);
    });

    // 监听目录添加
    this.watcher.on('addDir', (dirPath) => {
      this.handleNewDirectory(dirPath);
    });

    // 监听错误
    this.watcher.on('error', (error) => {
      logger.error('文件监控错误:', error);
    });

    this.isWatching = true;
  }

  /**
   * 停止文件监控
   */
  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.isWatching = false;
      logger.info('文件监控已停止');
    }
  }

  /**
   * 处理新文件
   * @param {string} filePath - 文件路径
   */
  async handleNewFile(filePath) {
    try {
      // 检查是否为视频文件
      if (!this.isVideoFile(filePath)) {
        return;
      }

      // 避免重复处理
      if (this.processedFiles.has(filePath)) {
        return;
      }

      logger.info(`检测到新视频文件: ${filePath}`);
      this.processedFiles.add(filePath);

      // 延迟处理，确保文件完全写入
      setTimeout(async () => {
        try {
          await movieProcessor.processMovieFile(filePath);
        } catch (error) {
          logger.error(`处理视频文件失败: ${filePath}`, error);
        }
      }, 3000);

    } catch (error) {
      logger.error(`处理新文件时出错: ${filePath}`, error);
    }
  }

  /**
   * 处理新目录
   * @param {string} dirPath - 目录路径
   */
  async handleNewDirectory(dirPath) {
    try {
      // 检查是否为电影目录（不是根目录）
      if (dirPath === this.watchDir) {
        return;
      }

      logger.info(`检测到新目录: ${dirPath}`);

      // 扫描目录中的视频文件
      const videoFiles = await this.findVideoFiles(dirPath);
      
      for (const videoFile of videoFiles) {
        await this.handleNewFile(videoFile);
      }

    } catch (error) {
      logger.error(`处理新目录时出错: ${dirPath}`, error);
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
   * 查找目录中的视频文件
   * @param {string} dirPath - 目录路径
   * @returns {Promise<Array>} 视频文件列表
   */
  async findVideoFiles(dirPath) {
    const videoFiles = [];
    
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile() && this.isVideoFile(filePath)) {
          videoFiles.push(filePath);
        }
      }
    } catch (error) {
      logger.error(`扫描目录失败: ${dirPath}`, error);
    }
    
    return videoFiles;
  }

  /**
   * 获取监控状态
   * @returns {Object} 监控状态
   */
  getStatus() {
    return {
      isWatching: this.isWatching,
      watchDir: this.watchDir,
      processedFilesCount: this.processedFiles.size
    };
  }
}

module.exports = new FileWatcher(); 