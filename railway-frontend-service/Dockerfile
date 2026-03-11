# 使用轻量级的 HTTP 服务器来提供静态文件
FROM node:20-alpine

WORKDIR /app

# 安装 serve 包
RUN npm install -g serve

# 复制前端构建产物（将在部署时从项目根目录复制）
COPY dist ./dist

# 暴露端口
EXPOSE 3000

# 启动静态文件服务器
CMD ["serve", "-s", "dist", "-l", "3000"]
