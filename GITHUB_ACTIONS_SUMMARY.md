# GitHub Actions 工作流配置说明

> **仓库**: https://github.com/kinglionsz/wuziqi/tree/at_home  
> **触发分支**: `at_home`

---

## 📋 工作流概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                         推送代码到 at_home 分支                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Job 1: 代码质量检查 (lint)                         │
│                    ESLint 检查代码规范                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│  Job 2: 构建前端           │       │  Job 3: 单元测试           │
│  - npm run build          │       │  - npm run test:run       │
│  - 上传 dist/ 产物         │       │  - 生成覆盖率报告          │
└───────────────────────────┘       └───────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Job 4: E2E 测试 (test-e2e)                        │
│                    Playwright 端到端测试                              │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Job 5: 构建并推送 Docker 镜像                            │
│              - 同步构建产物到 railway-frontend/dist/                  │
│              - 构建后端 Docker 镜像                                   │
│              - 构建前端 Docker 镜像                                   │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Job 6: 部署到 Railway                              │
│                    - 同步构建产物到 railway-frontend/dist/            │
│                    - 部署后端服务                                      │
│                    - 部署前端服务                                      │
│                    - 健康检查                                         │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Job 7: 部署通知 (notify)                           │
│                    输出部署结果和访问地址                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 工作流文件列表

| 文件名 | 功能 | 触发条件 |
|--------|------|----------|
| `ci-cd.yml` | 主 CI/CD 流水线 | push/PR 到 `at_home` 分支 |
| `deploy-dev.yml` | 开发环境部署 | push 到 `at_home` 分支 |
| `dependency-check.yml` | 依赖安全检查 | 每周一、package.json 变更 |
| `performance-test.yml` | 性能测试 | 每天凌晨、push 到 `at_home` |

---

## 🔧 配置详情

### 主 CI/CD 流水线 (`ci-cd.yml`)

| Job 名称 | 功能 | 依赖 | 条件 |
|----------|------|------|------|
| `lint` | 代码质量检查 | 无 | 始终运行 |
| `build-frontend` | 构建前端 | lint | 始终运行 |
| `test-unit` | 单元测试 | lint | 始终运行 |
| `test-e2e` | E2E 测试 | build-frontend | 始终运行 |
| `build-and-push-docker` | 构建 Docker 镜像 | build-frontend, test-unit | push 到 at_home |
| `deploy-railway` | 部署到 Railway | build-and-push-docker, test-e2e | push 到 at_home |
| `notify` | 部署通知 | deploy-railway | 始终运行 |

---

## 🔑 GitHub Secrets 配置

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中配置：

| Secret 名称 | 必需 | 说明 |
|-------------|------|------|
| `RAILWAY_TOKEN` | ✅ | Railway CLI 登录令牌 |
| `DOCKER_USERNAME` | 可选 | Docker Hub 用户名（用于推送镜像） |
| `DOCKER_PASSWORD` | 可选 | Docker Hub 密码 |

### 获取 Railway Token

1. 访问 [Railway Dashboard](https://railway.app/account/tokens)
2. 点击 **Create Token**
3. 复制生成的 Token
4. 在 GitHub Secrets 中添加为 `RAILWAY_TOKEN`

---

## 📦 构建产物同步流程

```
根目录构建 (npm run build)
        │
        ▼
    dist/ 产物
        │
        ▼
上传到 GitHub Artifacts
        │
        ▼
下载到 CI Runner
        │
        ▼
复制到 railway-frontend/dist/
        │
        ▼
Railway CLI 上传部署
```

**关键步骤**：
1. `build-frontend` job 构建前端，上传 `dist/` 作为 artifact
2. `build-and-push-docker` 和 `deploy-railway` job 下载 artifact
3. 同步构建产物到 `railway-frontend/dist/`
4. Railway CLI 上传整个 `railway-frontend/` 目录

---

## 🚀 部署环境

### 前端服务

| 配置项 | 值 |
|--------|-----|
| **构建器** | RAILPACK |
| **输出目录** | `dist/` |
| **启动命令** | `node server.js` |
| **功能** | Express 静态文件服务 + WebSocket 代理 |

### 后端服务

| 配置项 | 值 |
|--------|-----|
| **构建器** | DOCKERFILE |
| **启动命令** | `node server.js` |
| **功能** | Socket.io 实时通信（完整版：断线重连、观众、计时器、排名） |

---

## 🔄 使用场景

### 1. 正常开发流程

```bash
# 本地开发
npm run dev

# 本地测试
npm run test:run

# 构建测试
npm run build

# 提交并推送
git add .
git commit -m "feat: 新功能"
git push origin at_home
```

### 2. 手动触发部署

1. 进入 GitHub 仓库 **Actions** 页面
2. 选择 **CI/CD Pipeline**
3. 点击 **Run workflow**

### 3. 查看部署状态

```bash
# 使用 Railway CLI
railway status

# 查看日志
railway logs
```

---

## ⚠️ 常见问题

### 1. 构建产物同步失败

**原因**：`railway-frontend/dist/` 目录不存在或为空

**解决**：
- 确保 `build-frontend` job 成功完成
- 检查 artifact 是否正确上传

### 2. Railway 部署失败

**原因**：`RAILWAY_TOKEN` 未配置或过期

**解决**：
- 重新生成 Railway Token
- 更新 GitHub Secrets 中的 `RAILWAY_TOKEN`

### 3. E2E 测试超时

**原因**：Playwright 浏览器下载慢

**解决**：
- E2E 测试已设置 `continue-on-error: true`
- 不影响后续部署流程

---

## ✅ 配置检查清单

- [x] GitHub Secrets 已配置 `RAILWAY_TOKEN`
- [x] 工作流触发分支为 `at_home`
- [x] 前端 Dockerfile 使用预构建 `dist/`
- [x] 后端代码已同步完整功能版本
- [x] 构建产物同步步骤已添加

---

## 📝 更新日志

### 2024-03-11
- ✅ 修改所有工作流触发分支为 `at_home`
- ✅ 后端同步 CloudBase 完整版代码（断线重连、观众、计时器、排名）
- ✅ 前端 Dockerfile 重写为使用预构建 `dist/`
- ✅ 添加构建产物同步步骤
- ✅ 更新文档反映最新配置
