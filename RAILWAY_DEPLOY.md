# Railway 部署指南

## 后端部署 (Railway)

### 步骤 1: 连接 GitHub 仓库
1. 登录 [Railway](https://railway.com)
2. 创建新项目，选择 "Deploy from GitHub repo"
3. 选择 `wuziqi` 仓库

### 步骤 2: 配置后端服务
1. 在 Railway Dashboard 中，点击 "New" -> "Database" -> "PostgreSQL" (可选)
2. 点击 "New" -> "Service" -> "GitHub"
3. 选择 `wuziqi` 仓库
4. 设置 root directory 为 `railway-backend`

### 步骤 3: 设置环境变量
在 Railway 项目设置中添加以下环境变量：
- `PORT`: 3000

### 步骤 4: 部署
点击 "Deploy" 按钮开始部署。

部署成功后，您将获得一个后端 URL，例如：
`https://wuziqi-server-xxxxx.railway.app`

---

## 前端部署 (推荐使用 Vercel)

Railway 不是前端静态网站的最佳选择。推荐使用 **Vercel** 来部署前端：

### 步骤 1: 连接 Vercel
1. 登录 [Vercel](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 "Add New..." -> "Project"
4. 选择 `wuziqi` 仓库

### 步骤 2: 配置
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

### 步骤 3: 环境变量
添加以下环境变量：
- `VITE_SUPABASE_URL`: `https://pjnzmyvoucgmanoqvbav.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbnpteXZvdWNnbWFub3F2YmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTQzNDgsImV4cCI6MjA4NzMzMDM0OH0.wSaQNBG9nl8cgBtezhPdHeRTxXRaUyAGG8lZd2QMJvQ`
- `VITE_SOCKET_URL`: `<您的Railway后端URL>`

### 步骤 4: 部署
点击 "Deploy" 按钮。

---

## 更新前端 Socket URL

部署完成后，您需要更新前端的环境变量：

1. 获取 Railway 后端 URL
2. 在 Vercel 项目设置中更新 `VITE_SOCKET_URL`
3. 重新部署前端

---

## 备选方案: 全部使用 Railway

如果您坚持要在 Railway 上部署前端，需要：
1. 创建另一个 Railway 服务
2. 设置 root directory 为 `railway-frontend`
3. 等待构建完成（会比较慢）

注意：Railway 前端构建需要安装所有 npm 依赖，可能需要较长时间。
