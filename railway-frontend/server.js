const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// 后端地址
const BACKEND_URL = process.env.BACKEND_URL || 'https://wuziqi-railway-production.up.railway.app';

// 重要：代理必须放在静态文件服务之前！

// 代理 WebSocket 连接
app.use('/socket.io', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  ws: true,
  logLevel: 'debug'
}));

// 代理 HTTP 请求到后端
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  }
}));

// 其他代理...

// 放在代理之后
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});