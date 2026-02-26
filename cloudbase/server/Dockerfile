# 基础镜像 - Node.js 18
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 设置环境变量
# 强制禁用数据库（调试用，设为 false 启用数据库）
ENV FORCE_DISABLE_DB=1

# 启动命令
CMD ["node", "index.js"]
