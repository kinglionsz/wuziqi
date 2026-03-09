# MiniMax 平台部署指南

## 概述
您的五子棋游戏前端将部署到: `https://vfsmt568wm0q.space.minimaxi.com/`

## 当前配置
- 前端: MiniMax 平台
- 后端: Railway Socket.io 服务器 (`wuziqi-railway-production.up.railway.app`)

## 部署步骤

### 1. 构建前端
在部署到 MiniMax 之前，需要先构建前端：

```bash
npm run build
```

这会在 `dist` 目录中生成静态文件。

### 2. 部署到 MiniMax
根据 MiniMax 平台的部署方式上传 `dist` 目录中的文件。

### 3. 环境变量配置
确保在 MiniMax 平台设置以下环境变量：
- `VITE_SOCKET_URL`: `wuziqi-railway-production.up.railway.app`

## 测试
部署完成后，访问 `https://vfsmt568wm0q.space.minimaxi.com/` 测试在线对战功能。

## 注意事项
- 如果在线对战功能不工作，可能需要在 Socket URL 前面添加 `https://` 前缀
- MiniMax 平台可能需要在平台设置中添加环境变量
