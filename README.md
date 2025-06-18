# 字幕搜索器

一个智能的字幕搜索和下载系统，支持手动搜索和自动监控下载。

## 功能特性

### 🎬 电影搜索
- 通过IMDB API搜索电影信息
- 显示电影海报、年份、评分、简介等详细信息
- 支持模糊搜索和精确匹配

### 📝 字幕搜索与下载
- 通过OpenSubtitles API搜索字幕
- 支持多语言字幕（中文、英文等）
- 按下载量和评分智能排序
- 一键下载字幕文件

### 🤖 AI智能处理
- 使用DeepSeek AI简化复杂电影文件名
- 自动翻译英语字幕为中文
- 智能识别电影信息

### 📁 自动监控
- 监控指定目录的新增电影文件
- 自动搜索并下载匹配的字幕
- 保持字幕和电影文件在同一目录
- 自动重命名字幕文件

### 📊 日志记录
- 完整的操作日志记录
- 下载历史管理
- 错误追踪和调试信息

## 技术架构

### 后端 (Node.js)
- **Express.js** - Web框架
- **Chokidar** - 文件监控
- **Axios** - HTTP客户端
- **fs-extra** - 文件系统操作

### 前端 (Next.js)
- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

### API集成
- **IMDB API** - 电影信息搜索
- **OpenSubtitles API** - 字幕搜索下载
- **DeepSeek API** - AI智能处理

## 快速开始

### 1. 环境配置

复制环境变量文件：
```bash
cp env.example .env
```

编辑 `.env` 文件，配置必要的API密钥：
```env
# IMDB API配置
IMDB_API_KEY=your_imdb_api_key_here

# OpenSubtitles API配置
OPENSUBTITLES_API_KEY=your_opensubtitles_api_key_here
OPENSUBTITLES_USER_AGENT=your_user_agent_here

# DeepSeek AI API配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 电影监控目录配置
MOVIE_WATCH_DIR=G:/Movies
SUBTITLE_DOWNLOAD_DIR=G:/Subtitles

# 服务器配置
PORT=3001
CLIENT_PORT=3000

# 字幕语言偏好（逗号分隔）
PREFERRED_LANGUAGES=zh-CN,zh,en
```

### 2. 安装依赖

```bash
# 安装所有依赖
npm run install-all
```

### 3. 启动服务

```bash
# 开发模式（同时启动前后端）
npm run dev

# 或者分别启动
npm run server  # 后端服务 (端口3001)
npm run client  # 前端服务 (端口3000)
```

### 4. 访问应用

打开浏览器访问：http://localhost:3000

## 使用说明

### 手动搜索字幕
1. 在搜索框中输入电影名称
2. 点击搜索按钮
3. 从搜索结果中选择电影
4. 查看可用的字幕列表
5. 点击下载按钮获取字幕

### 自动监控功能
1. 在 `.env` 文件中配置 `MOVIE_WATCH_DIR`
2. 将电影文件放入监控目录
3. 系统自动检测新文件并下载字幕
4. 字幕文件保存在电影同目录下

### 下载历史
- 查看所有下载的字幕文件
- 显示文件大小、下载时间等信息
- 支持按时间排序

## 项目结构

```
subtitles_finder/
├── server/                 # 后端服务
│   ├── services/          # 业务服务层
│   │   ├── imdbService.js
│   │   ├── opensubtitlesService.js
│   │   ├── deepseekService.js
│   │   ├── fileWatcher.js
│   │   └── movieProcessor.js
│   ├── routes/            # API路由
│   │   ├── movies.js
│   │   └── subtitles.js
│   ├── utils/             # 工具函数
│   │   └── logger.js
│   ├── __tests__/         # 测试用例
│   └── index.js           # 服务入口
├── client/                # 前端应用
│   ├── app/              # Next.js App Router
│   ├── components/       # React组件
│   ├── types/            # TypeScript类型定义
│   └── package.json
├── env.example           # 环境变量示例
└── README.md
```

## 测试

### 运行测试
```bash
# 后端测试
cd server
npm test

# 测试覆盖率
npm run test:coverage

# 监听模式
npm run test:watch
```

### 测试覆盖
- ✅ 日志工具模块
- ✅ IMDB服务模块
- ✅ OpenSubtitles服务模块
- ✅ DeepSeek AI服务模块
- ✅ 文件监控模块
- ✅ 电影处理模块

## API文档

### 电影搜索
```
GET /api/movies/search?q=电影名称
```

### 获取电影详情
```
GET /api/movies/:id
```

### 搜索字幕
```
GET /api/subtitles/search?title=电影标题&year=年份&language=语言
```

### 下载字幕
```
POST /api/subtitles/download
{
  "subtitleId": "字幕ID",
  "fileName": "文件名",
  "movieTitle": "电影标题"
}
```

### 翻译字幕
```
POST /api/subtitles/translate
{
  "subtitleContent": "字幕内容",
  "targetLanguage": "目标语言"
}
```

### 获取下载历史
```
GET /api/subtitles/history
```

## 开发指南

### 代码规范
- 使用ESLint进行代码检查
- 遵循TypeScript类型安全
- 模块化设计，职责分离
- 完整的错误处理

### 添加新功能
1. 在 `server/services/` 中创建服务模块
2. 在 `server/routes/` 中添加API路由
3. 在 `client/components/` 中创建UI组件
4. 编写对应的测试用例

### 部署
```bash
# 构建前端
npm run build

# 启动生产服务
npm start
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v1.0.0
- 🎉 初始版本发布
- ✨ 支持电影搜索和字幕下载
- 🤖 集成AI智能处理
- 📁 自动文件监控功能
- 📊 完整的日志系统
- 🧪 全面的测试覆盖 