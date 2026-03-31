# GitHub Actions 配置指南

## 📋 概述

本项目配置了完整的 GitHub Actions CI/CD 流水线，实现自动化构建、测试和部署。

## 🚀 工作流文件

### 1. 主 CI/CD 流水线 (`ci-cd.yml`)

**触发条件：**
- `main` 或 `develop` 分支的 push 事件
- `main` 或 `develop` 分支的 pull request
- 手动触发

**包含的 Jobs：**

| Job | 名称 | 说明 |
|-----|------|------|
| `lint` | 代码质量检查 | 运行 ESLint 检查代码规范 |
| `build-frontend` | 构建前端 | 构建 React 前端到 `dist/` 目录 |
| `test-unit` | 单元测试 | 运行 Vitest 单元测试和覆盖率 |
| `test-e2e` | E2E 测试 | 使用 Playwright 进行端到端测试 |
| `build-and-push-docker` | 构建 Docker 镜像 | 构建前后端 Docker 镜像 |
| `deploy-railway` | 部署到 Railway | 自动部署到 Railway 平台 |
| `notify` | 部署通知 | 发送部署结果通知 |

### 2. 开发环境部署 (`deploy-dev.yml`)

**触发条件：**
- `develop` 分支的 push 事件
- 手动触发

**功能：**
- 自动部署到 Railway 开发环境
- 执行健康检查

## 🔧 配置步骤

### 步骤 1：配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

| Secret 名称 | 说明 | 获取方式 |
|------------|------|---------|
| `RAILWAY_TOKEN` | Railway API Token | Railway 控制台 → Account → API Tokens |
| `DOCKER_USERNAME` | Docker Hub 用户名（可选） | Docker Hub 账户 |
| `DOCKER_PASSWORD` | Docker Hub 密码（可选） | Docker Hub 密码 |

### 步骤 2：配置 Railway Token

1. 登录 Railway 控制台：https://railway.app
2. 点击右上角头像 → **Account**
3. 点击 **API Tokens** → **New Token**
4. 复制生成的 Token
5. 在 GitHub 仓库中添加 Secret：`Settings` → `Secrets and variables` → `Actions` → `New repository secret`
6. 名称：`RAILWAY_TOKEN`，值：粘贴刚才复制的 Token

### 步骤 3：配置 Railway 项目

确保 Railway 项目已配置好：

1. **后端服务**：使用 `railway-backend/Dockerfile`
2. **前端服务**：使用 `railway-frontend/Dockerfile`
3. **环境变量**：
   ```bash
   # 前端环境变量
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SOCKET_URL=wuziqi-railway-production.up.railway.app

   # 后端环境变量
   PORT=3000
   NODE_ENV=production
   ```

## 📊 工作流执行流程

```
触发条件 (push/PR)
    ↓
┌──────────────────────┐
│   lint (代码检查)      │
└──────────────────────┘
    ↓
┌──────────────────────┐    ┌──────────────────────┐
│ build-frontend (构建)  │    │ test-unit (单元测试)   │
└──────────────────────┘    └──────────────────────┘
    ↓                              ↓
└───────────┬──────────────────────┘
            ↓
   ┌──────────────────────┐
   │ test-e2e (E2E测试)    │
   └──────────────────────┘
            ↓
   ┌──────────────────────┐
   │ build-docker (镜像)  │
   └──────────────────────┘
            ↓
   ┌──────────────────────┐
   │ deploy-railway (部署)│
   └──────────────────────┘
            ↓
   ┌──────────────────────┐
   │   notify (通知)       │
   └──────────────────────┘
```

## 🎯 使用场景

### 场景 1：开发提交代码到 develop 分支

```bash
# 1. 提交代码
git add .
git commit -m "feat: 添加新功能"
git push origin develop

# 2. 自动触发 deploy-dev.yml
# 3. 自动部署到开发环境
# 4. 访问: https://wuziqi-dev.up.railway.app
```

### 场景 2：合并 PR 到 main 分支

```bash
# 1. 创建 PR 从 develop 到 main
# 2. 触发 ci-cd.yml 运行所有测试
# 3. 测试通过后合并 PR
# 4. 自动部署到生产环境
# 5. 访问: https://wuziqi-frontend-production.up.railway.app
```

### 场景 3：手动触发部署

1. 进入 GitHub 仓库 → **Actions** 标签
2. 选择 `CI/CD Pipeline` 或 `部署开发环境`
3. 点击 **Run workflow**
4. 选择分支，点击 **Run workflow**

## 📝 自定义配置

### 修改 Node.js 版本

编辑 `.github/workflows/ci-cd.yml`：

```yaml
env:
  NODE_VERSION: '20'  # 修改为其他版本，如 '18' 或 '22'
```

### 修改部署环境

编辑 `deploy-railway` job：

```yaml
environment:
  name: production
  url: https://your-custom-domain.com
```

### 添加更多测试

在 `test-unit` job 中添加：

```yaml
- name: 运行特定测试
  run: npm run test:specific
```

### 添加部署前检查

在 `deploy-railway` job 前添加：

```yaml
- name: 安全扫描
  uses: securego/gosec@master
  with:
    args: ./...
```

## 🔍 监控和调试

### 查看工作流运行状态

1. 进入 GitHub 仓库 → **Actions** 标签
2. 选择工作流运行记录
3. 查看每个 Job 的详细日志

### 调试失败的 Job

1. 点击失败的 Job
2. 查看详细的错误日志
3. 本地重现问题
4. 修复后重新推送

### 查看构建产物

1. 进入 Actions → 选择成功的运行
2. 滚动到底部 → **Artifacts**
3. 下载构建产物进行本地测试

## ⚡ 性能优化

### 1. 启用缓存

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # 缓存 npm 依赖
```

### 2. 并行执行 Jobs

```yaml
test-unit:
  needs: lint  # 只依赖 lint，可以和 build-frontend 并行
```

### 3. 使用 Docker 缓存

```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

## 🔐 安全最佳实践

### 1. 不要在代码中硬编码敏感信息

```yaml
# ❌ 错误
- name: 部署
  run: railway login --headless sk_live_xxx

# ✅ 正确
- name: 部署
  run: railway login --headless ${{ secrets.RAILWAY_TOKEN }}
```

### 2. 限制 Secrets 的访问权限

- 只在需要的 Jobs 中使用 Secrets
- 使用 `GitHub Environments` 控制部署权限

### 3. 定期轮换 Tokens

- 定期更新 Railway Token
- 定期更新 Docker Hub 密码

## 📚 常用命令

### 本地测试工作流

```bash
# 安装 act 工具（GitHub Actions 本地运行器）
brew install act  # macOS
# 或
chocolatey install act-cli  # Windows

# 运行工作流
act pull_request
```

### 查看 Railway 部署状态

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 查看状态
railway status

# 查看日志
railway logs
```

## 🐛 常见问题

### 问题 1：Railway Token 无效

**错误：** `Error: Railway token is invalid`

**解决：**
1. 重新生成 Railway Token
2. 更新 GitHub Secrets
3. 确保Token有足够的权限

### 问题 2：构建超时

**错误：** `Error: Build timeout exceeded`

**解决：**
```yaml
- name: 构建前端
  run: npm run build
  timeout-minutes: 30  # 增加超时时间
```

### 问题 3：测试失败

**错误：** `Test failed`

**解决：**
1. 本地运行测试：`npm run test:run`
2. 查看详细错误信息
3. 修复测试用例或代码

### 问题 4：部署后无法访问

**错误：** `502 Bad Gateway`

**解决：**
1. 检查 Railway 服务状态：`railway status`
2. 查看日志：`railway logs`
3. 确认环境变量配置正确

## 📞 支持

如遇问题，请：
1. 查看 Actions 日志获取详细错误信息
2. 参考本文档的常见问题部分
3. 在项目 Issues 中提问

---

**最后更新：** 2026-03-11
