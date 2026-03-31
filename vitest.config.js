import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    include: [
      'src/**/*.test.{js,jsx,ts,tsx}',
      'cloudbase/server/**/*.test.js'
    ],
    exclude: ['node_modules', 'dist', '**/node_modules/**'],
    // 使用 Vite 作为预处理，解决 ESM 导入问题
    deps: {
      // 让 Vitest 用 Vite 处理所有 .js 文件
      inline: [/\.js$/]
    },
    // 使用 Vite 的模块解析
    pool: 'forks',
    testTimeout: 30000
  }
})
