#!/bin/bash

# 字幕搜索器部署脚本

echo "🚀 开始部署字幕搜索器..."

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2未安装，请先安装PM2: npm install -g pm2"
    exit 1
fi

# 检查.env文件是否存在
if [ ! -f ".env" ]; then
    echo "❌ .env文件不存在，请先复制env.example并配置"
    exit 1
fi

# 创建日志目录
mkdir -p logs

echo "📦 安装依赖..."
npm run install-all

echo "🔨 构建前端..."
npm run build

echo "🛑 停止现有服务..."
pm2 delete ecosystem.config.js 2>/dev/null || true

echo "🚀 启动服务..."
pm2 start ecosystem.config.js

echo "💾 保存PM2配置..."
pm2 save

echo "📊 显示服务状态..."
pm2 status

echo "✅ 部署完成！"
echo "📝 查看日志: npm run pm2:logs"
echo "📊 查看状态: npm run pm2:status"
echo "🔄 重启服务: npm run pm2:restart" 