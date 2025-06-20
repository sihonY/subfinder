#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 获取端口配置
const port = process.env.PORT || 3001;

console.log(`启动后端服务，端口: ${port}`);

// 启动服务器
const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '../server'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: port }
});

serverProcess.on('error', (error) => {
    console.error('后端启动失败:', error);
    process.exit(1);
});

serverProcess.on('close', (code) => {
    console.log(`后端进程退出，代码: ${code}`);
    process.exit(code);
}); 