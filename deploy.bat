@echo off
chcp 65001 >nul

echo 🚀 开始部署字幕搜索器...

REM 检查PM2是否安装
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PM2未安装，请先安装PM2: npm install -g pm2
    pause
    exit /b 1
)

REM 检查.env文件是否存在
if not exist ".env" (
    echo ❌ .env文件不存在，请先复制env.example并配置
    pause
    exit /b 1
)

REM 创建日志目录
if not exist "logs" mkdir logs

echo 📦 安装依赖...
call npm run install-all

echo 🔨 构建前端...
call npm run build

echo 🛑 停止现有服务...
call pm2 delete ecosystem.config.js 2>nul

echo 🚀 启动服务...
call pm2 start ecosystem.config.js

echo 💾 保存PM2配置...
call pm2 save

echo 📊 显示服务状态...
call pm2 status

echo ✅ 部署完成！
echo 📝 查看日志: npm run pm2:logs
echo 📊 查看状态: npm run pm2:status
echo 🔄 重启服务: npm run pm2:restart

pause 