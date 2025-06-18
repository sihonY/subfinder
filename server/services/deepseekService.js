const axios = require('axios');
const logger = require('../utils/logger');

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = 'https://api.deepseek.com/v1/chat/completions';
    
    if (!this.apiKey) {
      throw new Error('DeepSeek API密钥未配置');
    }
  }

  /**
   * 简化电影名称
   * @param {string} movieName - 原始电影名称
   * @returns {Promise<string>} 简化后的电影名称
   */
  async simplifyMovieName(movieName) {
    try {
      logger.info(`AI简化电影名称: ${movieName}`);
      
      const prompt = `请简化以下电影文件名，提取出标准的电影名称。去掉年份、分辨率、编码格式、字幕信息等无关内容，只保留电影的核心名称。

原始文件名: ${movieName}

请只返回简化后的电影名称，不要包含任何解释或其他内容。`;

      const response = await axios.post(this.baseUrl, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const simplifiedName = response.data.choices[0].message.content.trim();
      logger.info(`电影名称简化结果: ${movieName} -> ${simplifiedName}`);
      
      return simplifiedName;
    } catch (error) {
      logger.error('AI简化电影名称失败:', error.message);
      throw error;
    }
  }

  /**
   * 翻译字幕内容
   * @param {string} subtitleContent - 字幕内容
   * @param {string} targetLanguage - 目标语言
   * @returns {Promise<string>} 翻译后的字幕内容
   */
  async translateSubtitle(subtitleContent, targetLanguage = 'zh-CN') {
    try {
      logger.info(`AI翻译字幕到 ${targetLanguage}`);
      
      const prompt = `请将以下字幕内容翻译成${targetLanguage}，保持字幕的时间轴格式不变，只翻译文本内容：

${subtitleContent}

请保持原有的字幕格式和时间轴，只翻译文本部分。`;

      const response = await axios.post(this.baseUrl, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const translatedContent = response.data.choices[0].message.content.trim();
      logger.info(`字幕翻译完成`);
      
      return translatedContent;
    } catch (error) {
      logger.error('AI翻译字幕失败:', error.message);
      throw error;
    }
  }
}

module.exports = new DeepSeekService(); 