/**
 * 五子棋前端服务器
 * 用于 Railway 静态网站托管
 */
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 提供静态文件服务
app.use(express.static(join(__dirname, 'dist')))

// SPA fallback - 返回 index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist/index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 五子棋前端已启动: http://0.0.0.0:${PORT}`)
})
