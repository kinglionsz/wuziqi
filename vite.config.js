import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',  // 使用相对路径，支持直接打开 dist/index.html
  server: {
    host: '0.0.0.0',  // 允许局域网访问
    port: 5173,        // 默认端口
  }
})
