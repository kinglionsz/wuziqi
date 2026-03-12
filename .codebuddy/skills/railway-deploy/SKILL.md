---
name: railway-deploy
description: This skill should be used when deploying projects to Railway using GitHub Actions. It provides the correct workflow configuration using RAILWAY_TOKEN for authentication, avoiding interactive login issues. Always use SSH for Git operations.
---

# Railway 自动部署 Skill

## 使用场景

当需要将项目部署到 Railway 平台时使用本 Skill。

## 关键配置要点

### 1. Railway 认证方式

**必须使用 Token 认证，禁止使用 `railway login --browserless`**

```yaml
env:
  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 2. 正确的部署命令

```yaml
- name: 部署到 Railway
  working-directory: ./服务目录
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: railway up --service 服务名
```

## 完整工作流示例

```yaml
name: Deploy to Railway

on:
  push:
    branches: [at_home]
  workflow_dispatch:

env:
  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 安装 Railway CLI
        run: npm install -g @railway/cli

      - name: 部署后端
        working-directory: ./railway-backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up --service backend

      - name: 部署前端
        working-directory: ./railway-frontend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up --service frontend
```

## 必需 Secrets

在 GitHub 仓库 Settings → Secrets → Actions 中配置：

| Secret 名称 | 说明 | 获取方式 |
|------------|------|---------|
| `RAILWAY_TOKEN` | Railway API Token | `railway token` 或 Dashboard → Account → Tokens |

## 注意事项

1. **不要**使用 `railway login --browserless`，它只适用于交互式环境
2. **不要**在 CI 中使用 `railway link`，使用 Token 直接认证
3. 确保 `RAILWAY_TOKEN` 有对应项目的部署权限
4. 多服务部署时，分别指定 `--service` 参数
