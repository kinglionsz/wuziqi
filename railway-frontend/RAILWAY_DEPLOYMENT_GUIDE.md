---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3045022100baa2a664895dc827923561e5ed56c48c4988a3e573aa3cc01f4ed32703e7bc5202206e3652cf4b4602501409071aea8a435ecfe9763869a16e1b4ba53277f6ba9ed2
    ReservedCode2: 3045022021775ebb4e9d8b9e399d0b23bc24e48b3756c7b1d001f0ddaa6a15c97d52e4a5022100c476b64c2165862505b1937fdc1ddd9c65b677c3d3672b92cabefdb193721689
---

# 五子棋游戏 Railway 部署完整指南

本文档详细记录了五子棋游戏前后端项目部署到 Railway 平台的完整过程，包括遇到的问题及解决方案。

## 项目概述

- **项目名称**：五子棋游戏 (Gobang)
- **作者**：狮王李
- **版本**：v1.2.7
- **技术栈**：前端 Vue.js (Vite) + 后端 Node.js
- **部署平台**：Railway

## 最终部署地址

| 服务 | 地址 |
|------|------|
| 前端 | https://wuziqi-frontend-production.up.railway.app |
| 后端 | https://wuziqi-railway-production.up.railway.app |

---

## 第一部分：后端部署（CLI 方式）

### 1.1 后端项目结构

后端项目位于 `railway-backend` 目录，是通过 GitHub 自动部署的。

### 1.2 后端 railway.json 配置

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.3 后端环境变量

在 Railway 后端服务中配置以下环境变量：

| 变量名 | 值 |
|--------|-----|
| NODE_ENV | production |
| SUPABASE_URL | 你的 Supabase URL |
| SUPABASE_KEY | 你的 Supabase Key |

---

## 第二部分：前端部署（CLI 方式）

### 2.1 前端项目结构

前端项目需要包含以下文件：

```
railway-frontend/
├── package.json          # Node.js 项目配置
├── server.js             # Express 服务器（带后端代理）
├── railway.json          # Railway 部署配置
├── start.sh             # 启动脚本
├── node_modules/        # 依赖目录
└── dist/                # 构建产物
    ├── index.html
    ├── docs.html
    ├── vite.svg
    └── assets/
        ├── index-CjNemF1I.js
        └── index-CxtLYeSZ.css
```

### 2.2 package.json 配置

```json
{
  "name": "wuziqi-frontend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "build": "echo 'Static site - no build needed'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6",
    "serve-static": "^1.15.0"
  }
}
```

**重要说明**：
- `build` 脚本不能执行 `node server.js`，否则会导致构建超时
- 使用简单的 echo 命令即可

### 2.3 server.js 配置（带后端代理）

```javascript
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

// 其他代理路径
app.use('/game', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true
}));

app.use('/room', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true
}));

// 静态文件服务（必须放在代理之后）
app.use(express.static(path.join(__dirname, 'dist')));

// SPA 路由 fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Backend proxy: ${BACKEND_URL}`);
});
```

### 2.4 railway.json 配置

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2.5 start.sh 启动脚本

```bash
#!/bin/bash
node server.js
```

---

## 第三部分：部署命令流程

### 3.1 安装依赖

```bash
cd railway-frontend
npm install
```

### 3.2 登录 Railway（如需要）

```bash
railway login
```

### 3.3 初始化项目（如需要创建新服务）

```bash
railway init
# 选择 workspace
# 选择 Create New
# 输入项目名称和服务名称
```

### 3.4 部署

```bash
railway up
```

### 3.5 查看部署状态

```bash
railway logs
```

---

## 第四部分：常见问题及解决方案

### 问题 1：Railway 上传文件只有 88 字节

**原因**：父目录存在 `.railwayignore` 文件，限制了上传内容。

**解决方案**：

检查并删除或修改父目录的 `.railwayignore` 文件：

```bash
# 删除父目录的限制文件
del /path/to/parent/.railwayignore
```

或者修改内容为：

```
!railway-backend/
!railway-frontend/
```

### 问题 2：Build timeout 构建超时

**原因**：在 Build Command 中错误地设置了 `node server.js`。

**解决方案**：

在 Railway 网站上进入服务设置 → Build → 删除自定义 Build Command，让 Railway 使用默认配置。

或者在 `package.json` 中确保 build 脚本是简单的 echo 命令：

```json
"build": "echo 'Static site - no build needed'"
```

### 问题 3：找不到 dist/index.html

**原因**：Railway 没有正确上传 dist 文件夹。

**解决方案**：

1. 确保删除父目录的 `.railwayignore`
2. 确保 dist 文件夹存在且包含所有文件
3. 重新运行 `railway up`

### 问题 4：API 请求返回 404

**原因**：代理配置顺序不正确，静态文件服务放在了代理之前。

**解决方案**：

确保 `server.js` 中代理配置在静态文件服务之前：

```javascript
// 代理配置（在前）
app.use('/api', createProxyMiddleware({...}));

// 静态文件服务（在后）
app.use(express.static(...));
```

### 问题 5：免费账户资源限制

**原因**：Railway 免费账户有资源配额限制。

**解决方案**：

1. 删除不再使用的测试项目
2. 在 Railway 网站上进入 Settings → Delete service/project
3. 保留必要的服务

---

## 第五部分：版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.2.7 | 2026-03-11 | 当前版本，修复代理配置 |
| v1.2.6 | 2026-03-09 | 初始版本 |

---

## 附录：部署检查清单

部署前确认以下事项：

- [ ] 父目录没有 `.railwayignore` 文件限制
- [ ] `package.json` 中的 build 脚本是简单命令
- [ ] `server.js` 中代理配置在静态文件之前
- [ ] `dist/` 文件夹包含所有前端构建文件
- [ ] `railway.json` 配置正确
- [ ] 后端服务已正常运行

---

**文档创建日期**：2026-03-11
**作者**：MiniMax Agent
