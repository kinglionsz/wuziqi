# ============================================
# 五子棋前端 Docker 镜像 - Railway 部署版本
# 静态文件 + Express 服务器
# ============================================

FROM node:20-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装生产依赖
RUN npm install --production

# 复制静态文件
COPY dist ./dist

# 复制服务器入口文件
COPY server.js ./

# 暴露端口（Railway 会通过 PORT 环境变量指定）
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 启动服务器
CMD ["node", "server.js"]
