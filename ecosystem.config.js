// 使用dotenv加载环境变量
require('dotenv').config();

module.exports = {
    apps: [
        {
            name: 'subtitles-finder',
            script: './server/index.js',
            cwd: './',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/error.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true,
            env: {
                NODE_ENV: 'production',
                ...process.env  // 直接使用已加载的环境变量
            },
            env_development: {
                NODE_ENV: 'development',
                ...process.env
            }
        }
    ]
}; 