---
name: GitHub Actions 部署流程修复
overview: 修复构建产物复制到 railway-frontend/dist/，优化前端 Dockerfile
todos:
  - id: fix-ci-cd-branch
    content: 修复 ci-cd.yml 第191行分支条件（main → at_home）
    status: completed
  - id: add-sync-step-docker
    content: 在 build-and-push-docker job 添加构建产物同步步骤
    status: completed
    dependencies:
      - fix-ci-cd-branch
  - id: add-sync-step-deploy
    content: 在 deploy-railway job 添加构建产物同步步骤
    status: completed
    dependencies:
      - fix-ci-cd-branch
  - id: rewrite-frontend-dockerfile
    content: 重写 railway-frontend/Dockerfile 使用预构建 dist/
    status: completed
  - id: update-summary-doc
    content: 更新 GITHUB_ACTIONS_SUMMARY.md 反映最新配置
    status: completed
---

## 用户需求

用户需要修复 GitHub Actions 工作流和前端 Dockerfile 的部署问题：

1. **修改 GitHub Actions 工作流** - 确保构建产物正确复制到 `railway-frontend/dist/`
2. **修改前端 Dockerfile** - 修复路径问题（当前 Dockerfile 尝试从根目录复制文件，但 railway-frontend/ 目录下没有这些文件）
3. **更新部署流程** - 完善构建→部署的自动化

## 发现的问题

1. `ci-cd.yml` 第191行 `build-and-push-docker` job 的条件仍是 `refs/heads/main`（漏改的一处）
2. 前端 Dockerfile 尝试从根目录复制 `src/`、`vite.config.js` 等，但 `railway-frontend/` 目录下没有这些文件
3. `deploy-railway` job 没有将根目录构建产物同步到 `railway-frontend/dist/`

## 项目架构说明

- **根目录** (`wuziqi/`): React 前端源码 (`src/`)，`npm run build` 输出到 `dist/`
- **railway-frontend/**: Railway 前端部署目录，包含 `dist/`（预构建产物）、`server.js`（Express 服务器）、`package.json`（Express 依赖）
- **railway-backend/**: Railway 后端部署目录，Socket.io 服务

## 技术方案

### 1. 修改 `.github/workflows/ci-cd.yml`

**修改点 1**: 第191行分支条件修复

```
# 修改前
if: github.event_name == 'push' && github.ref == 'refs/heads/main'

# 修改后
if: github.event_name == 'push' && github.ref == 'refs/heads/at_home'
```

**修改点 2**: `build-and-push-docker` job 添加构建产物同步步骤

```
- name: 下载前端构建产物
  uses: actions/download-artifact@v4
  with:
    name: frontend-dist
    path: dist/

- name: 同步构建产物到 railway-frontend
  run: |
    rm -rf railway-frontend/dist/*
    cp -r dist/* railway-frontend/dist/
    echo "构建产物已同步到 railway-frontend/dist/"
    ls -la railway-frontend/dist/
```

**修改点 3**: `deploy-railway` job 添加构建产物同步步骤（在 Railway CLI 安装之前）

**修改点 4**: 移除 `deploy-railway` 对 `build-and-push-docker` 的依赖（改为依赖 `build-frontend` 和 `test-unit`）

### 2. 修改 `railway-frontend/Dockerfile`

重写为使用预构建的 `dist/` 目录：

```
# 使用 Node.js 精简镜像
FROM node:20-alpine

WORKDIR /app

# 复制 package.json 和 server.js
COPY package*.json ./
COPY server.js ./

# 安装依赖
RUN npm install --production

# 复制预构建的前端产物
COPY dist ./dist

# 暴露端口
EXPOSE 3000

# 启动 Express 服务器
CMD ["node", "server.js"]
```

### 3. 实现原理

1. GitHub Actions 先在根目录构建前端 (`npm run build` → `dist/`)
2. 上传构建产物为 artifact
3. 在部署阶段下载 artifact 并同步到 `railway-frontend/dist/`
4. Railway CLI 上传 `railway-frontend/` 目录进行部署
5. Express 服务器 (`server.js`) 提供静态文件服务并代理 WebSocket 到后端

## 目录结构

```
wuziqi/
├── .github/workflows/
│   └── ci-cd.yml          # [MODIFY] 修复分支条件，添加构建产物同步
├── railway-frontend/
│   ├── Dockerfile         # [MODIFY] 重写为使用预构建 dist/
│   ├── server.js          # Express 静态服务器 + WebSocket 代理
│   ├── dist/              # 前端构建产物（CI 同步）
│   └── package.json       # Express 依赖
├── railway-backend/
│   ├── Dockerfile         # 无需修改
│   └── server.js          # Socket.io 服务
├── src/                   # React 前端源码
└── dist/                  # 根目录构建产物
```