/** @type {import('next').NextConfig} */
const nextConfig = {
  // 只在生产环境使用静态导出
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
  }),

  images: {
    unoptimized: true
  },

  // 开发环境配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:3001/api/:path*`,
      },
    ];
  },

  // 生产环境配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 