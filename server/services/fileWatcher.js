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
    this.isInitialized = false;
    this.processedFiles = new Set();
    this.processingDirs = new Set();
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
      depth: 1, // 只监控1层目录深度，不扫描子目录
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      },
      ignoreInitial: true
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

    // 监听就绪事件，标记初始化完成
    this.watcher.on('ready', () => {
      this.isInitialized = true;
      logger.info('文件监控初始化完成，开始监听文件变动');
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
      this.isInitialized = false;
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

      // 只有在初始化完成后才处理文件
      if (!this.isInitialized) {
        return;
      }

      // 只在任务触发时输出一次监控事件
      logger.info(`[文件监控] 检测到新视频文件: ${filePath}`);
      this.processedFiles.add(filePath);

      // 获取文件所在目录
      const dirPath = path.dirname(filePath);

      // 延迟处理，确保文件完全写入，然后以目录为单位处理
      setTimeout(async () => {
        try {
          await this.processDirectory(dirPath);
        } catch (error) {
          logger.error(`处理目录失败: ${dirPath}`, error);
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

      // 只有在初始化完成后才处理目录
      if (!this.isInitialized) {
        logger.debug(`忽略初始化时的目录: ${dirPath}`);
        return;
      }

      logger.info(`检测到新目录: ${dirPath}`);

      // 延迟处理，确保目录中的文件完全写入
      setTimeout(async () => {
        try {
          await this.processDirectory(dirPath);
        } catch (error) {
          logger.error(`处理目录失败: ${dirPath}`, error);
        }
      }, 3000);

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
      isInitialized: this.isInitialized,
      watchDir: this.watchDir,
      processedFilesCount: this.processedFiles.size
    };
  }

  /**
   * 手动处理现有文件（用于测试或特殊情况）
   * @param {string} filePath - 文件路径
   */
  async processExistingFile(filePath) {
    try {
      if (!this.isVideoFile(filePath)) {
        logger.debug(`跳过非视频文件: ${filePath}`);
        return;
      }

      logger.info(`手动处理现有文件: ${filePath}`);
      await movieProcessor.processMovieFile(filePath);
    } catch (error) {
      logger.error(`手动处理文件失败: ${filePath}`, error);
    }
  }

  /**
   * 手动处理现有目录（用于测试或特殊情况）
   * @param {string} dirPath - 目录路径
   */
  async processExistingDirectory(dirPath) {
    try {
      if (dirPath === this.watchDir) {
        return;
      }

      logger.info(`手动处理现有目录: ${dirPath}`);
      const videoFiles = await this.findVideoFiles(dirPath);

      for (const videoFile of videoFiles) {
        await this.processExistingFile(videoFile);
      }
    } catch (error) {
      logger.error(`手动处理目录失败: ${dirPath}`, error);
    }
  }

  /**
   * 处理目录（核心逻辑）
   * @param {string} dirPath - 目录路径
   */
  async processDirectory(dirPath) {
    if (this.processingDirs.has(dirPath)) {
      logger.info(`目录正在处理中，忽略本次触发: ${dirPath}`);
      return;
    }
    this.processingDirs.add(dirPath);
    try {
      // 扫描目录中的所有视频文件
      const videoFiles = await this.findVideoFiles(dirPath);
      if (videoFiles.length === 0) {
        logger.info(`[文件监控] 目录中没有找到视频文件: ${dirPath}`);
        return;
      }
      // 只输出一次所有扫描到的文件
      logger.info(`[文件监控] 目录扫描到视频文件: ${videoFiles.map(f => path.basename(f)).join(', ')}`);
      // 找到最大的非样片视频文件
      let largestVideoFile = null;
      let maxSize = 0;
      for (const videoFile of videoFiles) {
        const fileName = path.basename(videoFile);
        const stat = await fs.stat(videoFile);
        // 跳过样片文件
        if (this.isSampleFile(fileName)) {
          continue;
        }
        if (stat.size > maxSize) {
          largestVideoFile = videoFile;
          maxSize = stat.size;
        }
      }
      if (!largestVideoFile) {
        logger.warn(`[文件监控] 目录中没有找到合适的视频文件（可能都是样片）: ${dirPath}`);
        return;
      }
      // 只输出一次最终选取的文件
      logger.info(`[文件监控] 选取最大视频文件: ${path.basename(largestVideoFile)} (${(maxSize / 1024 / 1024).toFixed(2)} MB)`);
      // 处理选中的视频文件
      await movieProcessor.processMovieFile(largestVideoFile);
    } catch (error) {
      logger.error(`处理目录失败: ${dirPath}`, error);
    } finally {
      this.processingDirs.delete(dirPath);
      logger.info(`目录处理结束: ${dirPath}`);
    }
  }
}

module.exports = new FileWatcher(); 