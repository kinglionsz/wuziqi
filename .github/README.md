# GitHub Actions 工作流

本项目配置了完整的 CI/CD 流水线，实现自动化构建、测试、性能监控和安全检查。

## 📁 工作流文件

| 文件 | 说明 | 触发条件 |
|------|------|---------|
| `ci-cd.yml` | 主 CI/CD 流水线 | push 到 main/develop，PR，手动触发 |
| `deploy-dev.yml` | 开发环境部署 | push 到 develop，手动触发 |
| `dependency-check.yml` | 依赖安全检查 | 每周一，package.json 变更，手动触发 |
| `performance-test.yml` | 性能测试 | 每天凌晨，push 到 main，手动触发 |

## 🚀 快速开始

### 1. 配置 Secrets

在 GitHub 仓库设置中添加以下 Secrets：

- `RAILWAY_TOKEN` - Railway API Token（必填）
- `DOCKER_USERNAME` - Docker Hub 用户名（可选）
- `DOCKER_PASSWORD` - Docker Hub 密码（可选）

### 2. 推送代码触发 CI/CD

```bash
# 开发环境
git add .
git commit -m "feat: 新功能"
git push origin develop

# 生产环境
git checkout main
git merge develop
git push origin main
```

## 📊 工作流详情

### CI/CD Pipeline (ci-cd.yml)

完整的构建、测试和部署流程：

1. **代码质量检查** - ESLint 代码规范检查
2. **构建前端** - Vite 构建 React 应用
3. **单元测试** - Vitest 单元测试和覆盖率
4. **E2E 测试** - Playwright 端到端测试
5. **构建 Docker 镜像** - 前后端 Docker 镜像构建
6. **部署到 Railway** - 自动部署到 Railway 平台
7. **部署通知** - 发送部署结果通知

### 开发环境部署 (deploy-dev.yml)

自动部署 `develop` 分支到 Railway 开发环境。

### 依赖安全检查 (dependency-check.yml)

- 每周自动运行 `npm audit` 检查依赖漏洞
- 检查过时的依赖包
- 代码安全扫描

### 性能测试 (performance-test.yml)

- Lighthouse 性能评分测试
- 页面加载性能监控
- 负载测试

## 🔍 查看工作流

1. 进入 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择工作流查看运行记录和日志

## 📚 详细文档

更多详细信息请参考：
- [GitHub Actions 配置指南](./GITHUB_ACTIONS_GUIDE.md)

## 🛠️ 常用操作

### 手动触发工作流

1. 进入 **Actions** 标签
2. 选择要运行的工作流
3. 点击 **Run workflow**
4. 选择分支并确认

### 本地测试工作流

```bash
# 安装 act
brew install act  # macOS

# 运行工作流
act push
```

## 📞 问题反馈

如遇问题，请在项目 Issues 中反馈。
