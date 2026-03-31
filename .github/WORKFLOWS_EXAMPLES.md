# GitHub Actions 使用示例

## 📋 目录

- [常见使用场景](#常见使用场景)
- [工作流示例](#工作流示例)
- [故障排除](#故障排除)
- [最佳实践](#最佳实践)

## 常见使用场景

### 场景 1：开发新功能

```bash
# 1. 创建功能分支
git checkout -b feature/new-game-mode

# 2. 开发并提交代码
git add .
git commit -m "feat: 添加新的游戏模式"

# 3. 推送到远程
git push origin feature/new-game-mode

# 4. 在 GitHub 上创建 Pull Request 到 develop
# 5. CI 自动运行测试和代码检查
# 6. 测试通过后合并到 develop
# 7. 自动部署到开发环境
```

### 场景 2：修复 Bug

```bash
# 1. 创建修复分支
git checkout -b fix/game-bug

# 2. 修复 Bug 并提交
git add .
git commit -m "fix: 修复游戏卡顿问题"

# 3. 推送并创建 PR 到 main
git push origin fix/game-bug

# 4. CI 验证修复
# 5. 合并后自动部署到生产环境
```

### 场景 3：紧急热修复

```bash
# 1. 从 main 创建修复分支
git checkout main
git checkout -b hotfix/critical-fix

# 2. 快速修复
git add .
git commit -m "hotfix: 修复关键安全漏洞"

# 3. 推送并直接合并到 main
git push origin hotfix/critical-fix

# 4. 使用 Squash and merge 合并
# 5. 触发 CI/CD 自动部署
```

### 场景 4：手动部署到生产环境

```bash
# 1. 确保 develop 分支已经通过所有测试
git checkout develop
git pull origin develop

# 2. 合并到 main
git checkout main
git merge develop

# 3. 推送到 main 触发部署
git push origin main

# 或者使用 GitHub Actions UI 手动触发：
# 1. 进入 Actions 标签
# 2. 选择 "CI/CD Pipeline"
# 3. 点击 "Run workflow"
# 4. 选择 main 分支
# 5. 点击 "Run workflow"
```

## 工作流示例

### 示例 1：跳过 CI 检查（仅限紧急情况）

```bash
# 在 commit message 中添加 [skip ci]
git commit -m "hotfix: 修复问题 [skip ci]"
git push origin main

# 或使用 [ci skip]
git commit -m "文档更新 [ci skip]"
```

### 示例 2：仅运行特定 Job

在 `.github/workflows/ci-cd.yml` 中添加路径过滤：

```yaml
test-unit:
  name: 单元测试
  runs-on: ubuntu-latest
  if: contains(github.event.head_commit.modified, 'src/')
  # 只在 src/ 目录有变更时运行
```

### 示例 3：条件部署

```yaml
deploy-railway:
  name: 部署到 Railway
  runs-on: ubuntu-latest
  needs: [build-frontend, test-unit]
  if: |
    github.event_name == 'push' &&
    github.ref == 'refs/heads/main' &&
    !contains(github.event.head_commit.message, '[skip deploy]')
```

### 示例 4：并行运行测试

```yaml
test-unit:
  name: 单元测试
  runs-on: ubuntu-latest

test-e2e:
  name: E2E 测试
  runs-on: ubuntu-latest
  # 两个测试并行运行，无需等待

# 如果需要顺序执行，添加 needs
test-e2e:
  needs: test-unit
```

### 示例 5：缓存加速构建

```yaml
- name: 设置 Node.js 环境
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # 自动缓存 node_modules

# 或自定义缓存
- name: 缓存依赖
  uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### 示例 6：多环境部署

```yaml
deploy-dev:
  name: 部署到开发环境
  if: github.ref == 'refs/heads/develop'
  environment: development

deploy-prod:
  name: 部署到生产环境
  if: github.ref == 'refs/heads/main'
  environment: production
  runs-on: ubuntu-latest
  steps:
    - name: 部署
      run: railway up
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 示例 7：发送通知

```yaml
notify:
  name: 发送通知
  runs-on: ubuntu-latest
  needs: deploy-railway
  if: always()
  steps:
    - name: 成功通知
      if: needs.deploy-railway.result == 'success'
      run: echo "部署成功！"

    - name: 失败通知
      if: needs.deploy-railway.result == 'failure'
      run: |
        curl -X POST ${{ slack_webhook_url }} \
          -d '{"text":"部署失败！"}'
```

## 故障排除

### 问题 1：Railway Token 失效

**症状：**
```
Error: Railway token is invalid or expired
```

**解决方案：**

1. 重新生成 Railway Token
   ```bash
   # 访问：https://railway.app/account/tokens
   # 点击 "New Token"
   # 选择 "Read & Write" 权限
   # 复制新 Token
   ```

2. 更新 GitHub Secrets
   - GitHub 仓库 → Settings → Secrets
   - 找到 `RAILWAY_TOKEN`
   - 点击 Update 更新为新 Token

### 问题 2：构建超时

**症状：**
```
Error: Build timeout exceeded
```

**解决方案：**

在相关 Job 中增加超时时间：

```yaml
build-frontend:
  runs-on: ubuntu-latest
  timeout-minutes: 30  # 增加到 30 分钟
  steps:
    - uses: actions/checkout@v4
    - name: 构建前端
      run: npm run build
      timeout-minutes: 20  # 单个步骤超时 20 分钟
```

### 问题 3：测试失败

**症状：**
```
Test failed: Expected "X" to equal "Y"
```

**解决方案：**

1. 本地运行测试重现问题
   ```bash
   npm run test:run
   npm run test:ui  # 可视化界面
   ```

2. 查看详细的错误日志
   - GitHub Actions → 选择失败的运行
   - 点击失败的 Job
   - 展开查看详细日志

3. 修复后重新推送
   ```bash
   git add .
   git commit -m "fix: 修复测试用例"
   git push origin feature/branch-name
   ```

### 问题 4：依赖安装失败

**症状：**
```
Error: Cannot resolve dependency
```

**解决方案：**

1. 清理并重新安装
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. 检查 package.json 版本兼容性
   ```bash
   npm outdated
   ```

3. 更新到兼容版本
   ```bash
   npm install package-name@compatible-version
   ```

### 问题 5：部署后 404 错误

**症状：**
部署成功但访问显示 404

**解决方案：**

1. 检查 Railway 健康状态
   ```bash
   railway status
   railway logs
   ```

2. 验证构建产物
   ```bash
   npm run build
   ls -la dist/  # 确认 index.html 存在
   ```

3. 检查 Railway 配置
   - 确认 `outputDir` 正确
   - 确认 `start` 命令正确
   - 检查环境变量配置

### 问题 6：缓存问题

**症状：**
代码已更新但 CI 使用旧版本

**解决方案：**

1. 清除缓存
   ```yaml
   - name: 清除缓存
     uses: actions/github-script@v7
     with:
       script: |
         github.rest.actions.deleteActionsCache({
           owner: context.repo.owner,
           repo: context.repo.repo,
           cache_id: context.payload.actions_cache_id,
           ref: context.ref
         })
   ```

2. 或使用时间戳强制重新构建
   ```yaml
   - name: 安装依赖
     run: npm ci
     env:
       CACHE_BUST: ${{ github.sha }}
   ```

### 问题 7：并发冲突

**症状：**
多个 PR 同时部署导致冲突

**解决方案：**

使用互斥锁：

```yaml
deploy-railway:
  runs-on: ubuntu-latest
  steps:
    - name: 设置互斥锁
      uses: softprops/turnstyle@v1
      with:
        continue-after-seconds: 300  # 5 分钟后强制继续
```

## 最佳实践

### 1. 保持工作流简洁

```yaml
# ❌ 复杂的工作流
- name: 复杂的安装
  run: |
    if [ "${{ github.ref }}" == "refs/heads/main" ]; then
      npm ci --production
    else
      npm ci
    fi

# ✅ 简洁的工作流
- name: 安装依赖
  run: npm ci
```

### 2. 使用矩阵测试多个版本

```yaml
test:
  strategy:
    matrix:
      node-version: [18, 20, 22]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
```

### 3. 合理使用缓存

```yaml
# ✅ 缓存频繁变更的文件
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

# ❌ 不要缓存很少变更的文件
- uses: actions/cache@v3
  with:
    path: docs/
    key: docs
```

### 4. 保护生产环境

```yaml
deploy-prod:
  name: 部署到生产环境
  environment:
    name: production
    url: https://wuziqi-production.up.railway.app
  # 需要手动批准
  runs-on: ubuntu-latest
  steps:
    - name: 部署
      run: railway up
```

### 5. 使用有意义的名称

```yaml
# ✅ 清晰的名称
- name: 构建前端
  run: npm run build

- name: 运行单元测试
  run: npm test

# ❌ 模糊的名称
- name: 步骤1
  run: npm run build

- name: 步骤2
  run: npm test
```

### 6. 处理错误

```yaml
- name: 可能失败的任务
  id: might-fail
  run: npm run risky-task
  continue-on-error: true

- name: 根据结果执行
  if: steps.might-fail.outcome == 'failure'
  run: echo "任务失败，执行备用方案"
```

### 7. 使用环境变量

```yaml
jobs:
  build:
    env:
      NODE_ENV: production
      API_URL: ${{ secrets.API_URL }}
    steps:
      - run: echo $NODE_ENV
      - run: npm run build
```

### 8. 监控和日志

```yaml
- name: 记录开始时间
  run: echo "START_TIME=$(date +%s)" >> $GITHUB_ENV

- name: 执行任务
  run: npm run build

- name: 计算耗时
  run: |
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo "构建耗时: ${DURATION} 秒"
```

## 调试技巧

### 1. 启用调试日志

在 Secrets 中添加：
- `ACTIONS_STEP_DEBUG` = `true`
- `ACTIONS_RUNNER_DEBUG` = `true`

### 2. 使用 tmate 进入调试会话

```yaml
- name: 调试
  uses: mxschmitt/action-tmate@v3
  if: failure()
```

### 3. 查看详细输出

```yaml
- name: 运行命令
  run: |
    set -x  # 显示执行的每个命令
    npm run build
```

### 4. 导出环境变量

```yaml
- name: 查看所有环境变量
  run: env | sort
```

---

**相关文档：**
- [GitHub Actions 官方文档](https://docs.github.com/actions)
- [Railway CLI 文档](https://docs.railway.app/)
- [项目 GitHub Actions 指南](./GITHUB_ACTIONS_GUIDE.md)
