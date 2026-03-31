---
name: GitHub Actions 工作流分支配置更新
overview: 修改所有 GitHub Actions 工作流文件，将触发分支从 main/develop 改为 at_home 分支，并更新相关文档
todos:
  - id: modify-ci-cd
    content: 修改 .github/workflows/ci-cd.yml 分支配置
    status: completed
  - id: modify-deploy-dev
    content: 修改 .github/workflows/deploy-dev.yml 分支配置
    status: completed
  - id: modify-performance
    content: 修改 .github/workflows/performance-test.yml 分支配置
    status: completed
  - id: modify-dependency
    content: 修改 .github/workflows/dependency-check.yml 分支配置
    status: completed
  - id: update-summary
    content: 更新 GITHUB_ACTIONS_SUMMARY.md 文档内容
    status: completed
---

## 需求概述

用户需要修改 GitHub Actions 工作流配置，将所有触发分支从 `main/develop` 改为 `at_home` 分支，并更新 `GITHUB_ACTIONS_SUMMARY.md` 文档。

## 具体需求

1. **修改工作流分支配置**：将所有工作流文件中的触发分支从 `main/develop` 改为 `at_home`
2. **更新条件判断**：修改 CI/CD 流水线中的分支条件判断
3. **更新文档**：完善 `GITHUB_ACTIONS_SUMMARY.md` 内容，反映最新的分支配置
4. **提交到 Git**：将修改后的文件提交到 at_home 分支

## 涉及的文件

- `.github/workflows/ci-cd.yml`
- `.github/workflows/deploy-dev.yml`
- `.github/workflows/performance-test.yml`
- `.github/workflows/dependency-check.yml`
- `GITHUB_ACTIONS_SUMMARY.md`

## 技术方案

### 修改内容清单

#### 1. ci-cd.yml 修改点

- `on.push.branches: [main, develop]` → `[at_home]`
- `on.pull_request.branches: [main, develop]` → `[at_home]`
- `build-and-push-docker` job 的条件: `github.ref == 'refs/heads/main'` → `'refs/heads/at_home'`
- `deploy-railway` job 的条件: 同上

#### 2. deploy-dev.yml 修改点

- `on.push.branches: [develop]` → `[at_home]`

#### 3. performance-test.yml 修改点

- `on.push.branches: [main]` → `[at_home]`

#### 4. dependency-check.yml 修改点

- `on.push.branches: [main, develop]` → `[at_home]`

#### 5. GITHUB_ACTIONS_SUMMARY.md 更新内容

- 更新触发分支说明
- 更新使用场景示例
- 更新仓库 URL
- 添加配置检查清单
- 完善部署流程说明