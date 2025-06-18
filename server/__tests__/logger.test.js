const fs = require('fs-extra');
const path = require('path');
const Logger = require('../utils/logger');

// Mock fs-extra
jest.mock('fs-extra');

describe('Logger', () => {
  beforeEach(() => {
    // 清除所有模拟
    jest.clearAllMocks();
    
    // 模拟console方法
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('构造函数', () => {
    test('应该创建日志目录', () => {
      fs.existsSync.mockReturnValue(false);
      
      // 重新创建Logger实例
      const logger = require('../utils/logger');
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('logs'),
        { recursive: true }
      );
    });

    test('日志目录已存在时不应创建', () => {
      fs.existsSync.mockReturnValue(true);
      
      // 重新创建Logger实例
      const logger = require('../utils/logger');
      
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('info方法', () => {
    test('应该记录信息日志', () => {
      const logger = require('../utils/logger');
      const message = '测试信息';
      const data = { key: 'value' };
      
      logger.info(message, data);
      
      expect(console.log).toHaveBeenCalledWith('[INFO] 测试信息', { key: 'value' });
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.log'),
        expect.stringContaining('"level":"INFO"')
      );
    });

    test('应该记录不带数据的日志', () => {
      const logger = require('../utils/logger');
      const message = '测试信息';
      
      logger.info(message);
      
      expect(console.log).toHaveBeenCalledWith('[INFO] 测试信息', '');
    });
  });

  describe('error方法', () => {
    test('应该记录错误日志', () => {
      const logger = require('../utils/logger');
      const message = '测试错误';
      const error = new Error('测试异常');
      
      logger.error(message, error);
      
      expect(console.error).toHaveBeenCalledWith('[ERROR] 测试错误', error);
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.log'),
        expect.stringContaining('"level":"ERROR"')
      );
    });
  });

  describe('warn方法', () => {
    test('应该记录警告日志', () => {
      const logger = require('../utils/logger');
      const message = '测试警告';
      
      logger.warn(message);
      
      expect(console.warn).toHaveBeenCalledWith('[WARN] 测试警告', '');
    });
  });

  describe('debug方法', () => {
    test('开发环境下应该记录调试日志', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const logger = require('../utils/logger');
      const message = '测试调试';
      
      logger.debug(message);
      
      expect(console.debug).toHaveBeenCalledWith('[DEBUG] 测试调试', '');
      
      process.env.NODE_ENV = originalEnv;
    });

    test('生产环境下不应记录调试日志', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const logger = require('../utils/logger');
      const message = '测试调试';
      
      logger.debug(message);
      
      expect(console.debug).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('formatMessage', () => {
    test('应该格式化日志消息', () => {
      const logger = require('../utils/logger');
      const message = '测试消息';
      const data = { test: 'data' };
      
      const formatted = logger.formatMessage('INFO', message, data);
      const parsed = JSON.parse(formatted);
      
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('level', 'INFO');
      expect(parsed).toHaveProperty('message', message);
      expect(parsed).toHaveProperty('data', data);
    });
  });
}); 