# GitHub Actions 失败排查与修复

## 📊 当前状态

**推送触发的工作流** (commit ee6d34b, branch: at_home):

| 工作流 | 状态 | 耗时 | 失败原因 |
|--------|------|------|---------|
| 部署开发环境 | ❌ 失败 | 27s | 缺少 RAILWAY_TOKEN |
| 依赖安全检查 | ❌ 失败 | 40s | CodeQL 配置问题 |
| CI/CD Pipeline | ❌ 失败 | - | 缺少 RAILWAY_TOKEN |
| 性能测试 | ✅ 成功 | 2m 25s | 正常 |

---

## 🔍 失败原因分析

### 1. 部署开发环境 / CI/CD Pipeline - RAILWAY_TOKEN 缺失

**错误信息**:
```
Error: RAILWAY_TOKEN is not set
```

**原因**:
- GitHub 仓库的 Secrets 中未配置 `RAILWAY_TOKEN`
- 多个工作流都依赖此 token 进行 Railway 部署

### 2. 依赖安全检查 - CodeQL 问题

**错误信息**:
```
Error: Invalid configuration for CodeQL analysis
```

**原因**:
- CodeQL 分析需要 GitHub Advanced Security 许可证
- 免费账户无法使用 CodeQL 分析功能

---

## ✅ 修复方案

### 方案 1：配置 Railway Token（推荐）

#### 步骤 1: 获取 Railway Token

1. 登录 [Railway](https://railway.app/)
2. 点击右上角头像 → **Account Settings**
3. 滚动到 **API Tokens** 部分
4. 点击 **Create New Token**
5. 给 token 命名（如：`github-actions`）
6. 选择权限：**Project Access** → 选择你的项目
7. 点击 **Create Token**
8. **立即复制 token**（只显示一次）

#### 步骤 2: 在 GitHub 中配置 Secrets

1. 打开你的 GitHub 仓库
2. 点击 **Settings** 标签页
3. 左侧菜单 → **Secrets and variables** → **Actions**
4. 点击 **New repository secret** 按钮
5. 配置如下：

| Name | Secret |
|------|---------|
| `RAILWAY_TOKEN` | 粘贴步骤 1 中复制的 token |

6. 点击 **Add secret** 保存

#### 步骤 3: 重新触发工作流

在本地执行：
```bash
git commit --allow-empty -m "trigger: 重新触发部署"
git push origin at_home
```

或者在 GitHub 页面：
1. 进入 **Actions** 标签页
2. 选择失败的工作流
3. 点击 **Re-run failed jobs**

---

### 方案 2：禁用失败的工作流

如果你不需要这些工作流，可以暂时禁用它们：

#### 禁用 CodeQL 分析（依赖安全检查）

修改 `.github/workflows/dependency-check.yml`:

```yaml
security-scan:
  name: 代码安全扫描
  runs-on: ubuntu-latest
  # 添加 if 条件禁用
  if: false
  steps:
    - name: 检出代码
      uses: actions/checkout@v4
    # ... 其他步骤
```

或者删除整个 `security-scan` job。

#### 禁用开发环境部署

修改 `.github/workflows/deploy-dev.yml`:

```yaml
on:
  push:
    branches: [at_home]
  workflow_dispatch:
  # 添加条件限制
  if: github.event_name == 'workflow_dispatch'
```

这样只有手动触发时才会运行，不会在 push 时自动触发。

---

## 🎯 推荐操作（快速修复）

### 选项 A: 只修复 Railway Token（5分钟）

```bash
# 1. 配置 GitHub Secrets（在网页上操作）
Settings → Secrets and variables → Actions
→ Add secret: RAILWAY_TOKEN

# 2. 重新触发工作流
git commit --allow-empty -m "trigger: 重新触发部署"
git push origin at_home
```

### 选项 B: 暂时禁用不需要的工作流（2分钟）

创建修复分支并修改工作流配置，然后推送。

### 选项 C: 只保留需要的 CI/CD

删除或禁用多余的工作流，只保留 `ci-cd.yml`。

---

## 📋 工作流说明

### 当前所有工作流

| 文件 | 触发条件 | 用途 | 优先级 |
|------|---------|------|--------|
| `ci-cd.yml` | push to at_home | 主 CI/CD 流程 | 🔴 必须 |
| `deploy-dev.yml` | push to at_home | 开发环境部署 | 🟡 可选 |
| `dependency-check.yml` | push to at_home | 依赖安全检查 | 🟢 可选 |
| `performance-test.yml` | push to at_home | 性能测试 | 🟢 可选 |
| `my-workflow.yml` | - | 旧工作流 | ⚪ 可删除 |

### 建议保留

- ✅ **ci-cd.yml** - 主要的 CI/CD 流程
- ✅ **performance-test.yml** - 性能测试（已成功）

### 建议禁用/删除

- ⚠️ **deploy-dev.yml** - 如果不需要独立开发环境
- ⚠️ **dependency-check.yml** - CodeQL 需要付费许可证
- ❌ **my-workflow.yml** - 重复的旧工作流

---

## 🔧 快速修复脚本

### 创建修复分支并禁用 CodeQL

```bash
# 1. 创建修复分支
git checkout -b fix/github-actions

# 2. 编辑 dependency-check.yml
# 注释或删除 security-scan job

# 3. 提交并推送
git add .github/workflows/dependency-check.yml
git commit -m "fix: 禁用 CodeQL 分析（需要付费许可证）"
git push origin fix/github-actions

# 4. 创建 PR 合并到 at_home
```

### 删除不需要的工作流

```bash
# 删除重复和不需要的工作流
rm .github/workflows/my-workflow.yml
git add .github/workflows/my-workflow.yml
git commit -m "chore: 删除重复的旧工作流"
git push origin at_home
```

---

## 📞 获取帮助

### Railway 相关问题

- **Railway 文档**: https://docs.railway.app/
- **Railway CLI**: https://docs.railway.app/develop/cli
- **Token 生成**: Account Settings → API Tokens

### GitHub Actions 相关问题

- **GitHub Actions 文档**: https://docs.github.com/en/actions
- **Secrets 配置**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **工作流调试**: https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows

---

## ✅ 下一步行动

**立即执行**（5分钟）:
1. 📋 获取 Railway Token
2. 🔑 在 GitHub Secrets 中配置 `RAILWAY_TOKEN`
3. 🔄 重新触发工作流

**后续优化**（可选）:
1. 🧹 清理不需要的工作流文件
2. ⚙️ 优化工作流触发条件
3. 📝 添加详细的部署文档

---

*生成时间: 2026-03-12*
*版本: v2.0.0*
