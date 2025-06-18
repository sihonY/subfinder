@echo off
echo 启动字幕搜索器...
echo.

echo 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo 检查环境配置文件...
if not exist ".env" (
    echo 警告: 未找到.env文件，正在复制示例配置...
    copy "env.example" ".env"
    echo 请编辑.env文件配置API密钥
    pause
)

echo 安装依赖...
call npm run install-all

echo 启动服务...
call npm run dev

pause 