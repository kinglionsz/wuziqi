---
name: Railway 部署前置测试计划
overview: 按稳妥流程推进：本地构建 → 本地测试 → 确认无误 → 推送部署
todos:
  - id: build-frontend
    content: 在根目录执行 npm run build 构建最新前端
    status: completed
  - id: test-backend
    content: 测试后端服务启动（cd railway-backend && npm install && npm start）
    status: completed
  - id: test-frontend
    content: 测试前端服务启动和后端通信
    status: completed
    dependencies:
      - build-frontend
  - id: sync-dist
    content: 同步构建产物到 railway-frontend/dist/
    status: completed
    dependencies:
      - test-frontend
      - test-backend
  - id: git-commit-push
    content: Git commit 并推送到 at_home 分支
    status: completed
    dependencies:
      - sync-dist
---

## 用户需求

用户要求确保 GitHub Actions 自动部署零失误，建议按以下稳妥流程推进：

1. **先 build** - 在根目录构建最新前端
2. **本地测试（重中之重）** - 验证前后端代码能正常工作
3. **导入到对应的 railway 前后端** - 同步构建产物到部署目录
4. **推送代码** - git commit & push
5. **自动部署完成** - GitHub Actions 触发 CI/CD

用户强调**本地测试完全没有问题是重中之重**。

## 当前项目状态

### 后端 (`railway-backend/`)

- `server.js` - 完整功能后端（928行，支持断线重连、观众、计时器、排名）
- `utils/gameLogic.js` - 游戏逻辑模块（已存在）
- `package.json` - 依赖正确（无 CloudBase SDK）
- `Dockerfile` - 正确配置

### 前端 (`railway-frontend/`)

- `server.js` - Express 静态文件服务 + WebSocket 代理
- `dist/` - 已有构建产物（但可能不是最新）
- `package.json` - 依赖正确
- `Dockerfile` - 使用预构建 dist/

### CI/CD (`.github/workflows/ci-cd.yml`)

- 触发分支：`at_home` ✓
- 构建产物同步步骤已添加 ✓

## 需要验证的关键点

1. 后端能否正常启动（无语法错误、依赖正确）
2. 前端能否正常启动（静态文件服务、代理配置）
3. 前后端能否正常通信（WebSocket 连接）
4. 构建产物正确同步到 `railway-frontend/dist/`

## 技术方案

### 执行流程

```
Step 1: 构建前端 (npm run build)
    ↓
Step 2: 启动后端服务测试 (localhost:3000)
    ↓
Step 3: 启动前端服务测试 (localhost:5173 或其他端口)
    ↓
Step 4: 测试完整游戏流程
    ↓
Step 5: 同步构建产物到 railway-frontend/dist/
    ↓
Step 6: Git commit & push
    ↓
Step 7: GitHub Actions 自动部署
```

### 测试验证点

| 测试项 | 验证方法 | 预期结果 |
| --- | --- | --- |
| 后端启动 | `cd railway-backend && npm install && npm start` | 控制台输出"五子棋在线对战服务器 (Railway) v2.0.0 已启动" |
| 后端健康检查 | 浏览器访问 `http://localhost:3000/` | 返回"五子棋在线对战服务器 (Railway) 运行中" |
| 前端启动 | 根目录 `npm run dev` | 前端正常加载，无报错 |
| WebSocket 连接 | 创建房间、加入房间 | 控制台显示连接成功日志 |
| 游戏流程 | 双人对战测试 | 落子、胜负判定正常 |


### 本地测试命令

```
# 终端 1：启动后端
cd railway-backend
npm install
npm start

# 终端 2：构建并启动前端
npm run build
cp -r dist/* railway-frontend/dist/
cd railway-frontend
npm install
npm start
```

### 构建产物同步

根目录构建后，需要将 `dist/` 复制到 `railway-frontend/dist/`：

```
# Windows PowerShell
Remove-Item -Recurse -Force railway-frontend\dist\*
Copy-Item -Recurse dist\* railway-frontend\dist\
```

### 风险控制

1. **本地测试失败** → 不推送，修复问题后重新测试
2. **后端启动失败** → 检查依赖安装、端口占用
3. **前端无法连接后端** → 检查 CORS 配置、代理配置