const fs = require('fs-extra');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(logEntry) {
    const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logEntry + '\n');
  }

  info(message, data = null) {
    const logEntry = this.formatMessage('INFO', message, data);
    console.log(`[INFO] ${message}`, data || '');
    this.writeToFile(logEntry);
  }

  error(message, error = null) {
    const logEntry = this.formatMessage('ERROR', message, error);
    console.error(`[ERROR] ${message}`, error || '');
    this.writeToFile(logEntry);
  }

  warn(message, data = null) {
    const logEntry = this.formatMessage('WARN', message, data);
    console.warn(`[WARN] ${message}`, data || '');
    this.writeToFile(logEntry);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = this.formatMessage('DEBUG', message, data);
      console.debug(`[DEBUG] ${message}`, data || '');
      this.writeToFile(logEntry);
    }
  }
}

module.exports = new Logger(); 