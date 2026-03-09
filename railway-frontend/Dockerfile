# 多阶段构建：第一阶段构建前端
FROM node:20-alpine as builder

# 设置环境变量
ENV VITE_SUPABASE_URL=https://pjnzmyvoucgmanoqvbav.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbnpteXZvdWNnbWFub3F2YmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTQzNDgsImV4cCI6MjA4NzMzMDM0OH0.wSaQNBG9nl8cgBtezhPdHeRTxXRaUyAGG8lZd2QMJvQ
ENV VITE_SOCKET_URL=wuziqi-railway-production.up.railway.app

# 设置工作目录
WORKDIR /app

# 复制根目录的配置文件
COPY package*.json ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./
COPY jsconfig.json ./
COPY index.html ./
COPY src ./src
COPY public ./public

# 安装依赖
RUN npm install

# 构建前端
RUN npm run build

# 第二阶段：运行静态服务器
FROM node:20-alpine

WORKDIR /app

# 安装 serve
RUN npm install -g serve

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["serve", "-s", "dist", "-l", "3000"]
