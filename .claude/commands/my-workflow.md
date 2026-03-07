---
description: 五子棋项目开发工作流 - 包含任务接收、代码修改、测试、代码审查、提交部署等完整流程
---
```mermaid
flowchart TD
    start([Start: 开始工作流]) --> task_receive[接收任务: 询问用户需求]

    task_receive --> task_clarify{任务是否清晰?}
    task_clarify -->|否| clarify_ask[详细询问需求]
    clarify_ask --> task_receive

    task_clarify -->|是| check_backup[检查备份文件]

    %% 备份文件检查节点
    check_backup --> backup_check{Backup 文件?}
    backup_check -->|有| clean_backup[删除备份文件: *copy*, *副本*, *_backup*]
    clean_backup --> code_understand[理解现有代码结构]
    backup_check -->|无| code_understand

    code_understand --> do_code[代码修改]

    do_code --> test_phase[测试阶段]
    test_phase --> run_dev[启动开发环境]

    run_dev --> backend_start{后端启动?}
    backend_start -->|失败| fix_backend[解决后端问题]
    fix_backend --> backend_start

    backend_start -->|成功| frontend_start[启动前端]
    frontend_start --> run_test[运行自动化测试]

    run_test --> test_pass{测试通过?}
    test_pass -->|否| fix_test[修复测试问题]
    fix_test --> run_test

    test_pass -->|是| e2e_test[E2E 测试阶段]

    %% E2E 测试阶段
    e2e_test --> db_test[数据库测试: test_ranking_db.js]
    db_test --> db_result{数据库通过?}
    db_result -->|否| fix_db[修复数据库问题]
    fix_db --> db_test

    db_result -->|是| playwright_test[Playwright 测试: test_ranking_playwright.js]
    playwright_test --> playwright_result{Playwright通过?}
    playwright_result -->|否| fix_e2e[修复 E2E 问题]
    fix_e2e --> playwright_test

    playwright_result -->|是| code_review[代码审查]

    %% 代码审查阶段
    code_review --> review_security{安全检查?}
    review_security -->|需要| fix_security[修复安全问题]
    fix_security --> review_security
    review_security -->|通过| review_quality{代码质量?}
    review_quality -->|需要| fix_quality[修复代码质量问题]
    fix_quality --> review_quality
    review_quality -->|通过| update_docs[更新文档]

    update_docs --> commit_phase[提交代码]
    commit_phase --> commit_msg[编写提交信息]
    commit_msg --> git_add[git add 文件]
    git_add --> git_commit[git commit]
    git_commit --> push_remote[推送到远程]

    push_remote --> deploy_phase[部署阶段]
    deploy_phase --> build[构建生产版本]
    build --> deploy_frontend[部署前端]
    deploy_frontend --> deploy_backend[部署后端]
    deploy_backend --> deploy_docs[部署文档]

    deploy_docs --> end([End: 工作流完成])

```

## 工作流程执行指南

### 节点执行方法

| 节点类型 | 说明 | 执行方式 |
|---------|------|---------|
| 菱形节点 (判断) | 条件分支判断 | 使用 AskUserQuestion 工具确认或自动检测 |
| 矩形节点 (操作) | 具体执行任务 | 直接执行描述的操作 |

---

### 阶段 1: 接收任务

**触发**: 用户运行 `/my-workflow` 命令

1. 询问用户具体需求
2. 明确任务目标和范围
3. 确认是否有特殊要求

---

### 阶段 2: 文件整理检查

**自动执行**:

```bash
# 查找备份文件
Get-ChildItem -Recurse -Filter "*copy*" | Select-Object FullName
Get-ChildItem -Recurse -Filter "*副本*" | Select-Object FullName
Get-ChildItem -Recurse -Filter "*_backup*" | Select-Object FullName
```

**检查规则** (来自知识库 `文件管理习惯.md`):

| 模式 | 说明 | 行动 |
|------|------|------|
| `*copy*` | 调试/备份文件 | 删除 |
| `*副本*` | 中文备份文件夹 | 删除 |
| `*_backup*` | 带 backup 后缀 | 删除 |

---

### 阶段 3: 代码修改

**流程**:
1. 理解现有代码结构
2. 按需修改代码
3. 遵循项目文件组织规范

**文件命名规范**:
- 组件: `PascalCase.jsx`
- Hooks: `camelCase.js`
- 工具: `camelCase.js`
- 样式: 与组件同名 `.css`

---

### 阶段 4: 测试

**启动命令**:

```bash
# 后端 (允许跨域)
ALLOWED_ORIGIN="*" npm run server

# 前端
npm run dev

# 同时启动
npm start
```

**常见问题解决**:

| 问题 | 解决方案 |
|------|---------|
| 端口占用 | `netstat -ano \| findstr <端口>` 然后 `taskkill //F //PID <PID>` |
| CORS 错误 | 设置环境变量 `ALLOWED_ORIGIN="*"` |
| 连接云端 | 使用 `.env.development` 配置本地服务器 |

---

### 阶段 4.1: E2E 测试 (排名系统)

**数据库测试**:

```bash
# 运行数据库测试
node test_ranking_db.js
```

**Playwright E2E 测试**:

```bash
# 确保前后端已启动，然后运行
npx playwright install chromium  # 首次安装
node test_ranking_playwright.js
```

**测试内容**:
- 首页加载和排名按钮显示
- 打开排名模态框
- 排行榜数据加载
- 战绩面板切换
- 段位显示
- 统计数据展示
- 模态框关闭
- 首页段位图标

---

### 阶段 4.2: 测试问题修复

**常见测试问题及解决方案**:

| 问题 | 错误信息 | 解决方案 |
|------|---------|---------|
| Supabase 406 错误 | HTTP 406 (Not Acceptable) | 将 `.single()` 改为 `.maybeSingle()` |
| RLS 阻止插入 | Row level security error | 创建 RLS 策略或禁用 RLS |
| Playwright 超时 | Timeout exceeded | 增加 waitForSelector 超时时间 |
| 端口占用 | Port already in use | `taskkill //F //PID <PID>` |

**Supabase 406 错误修复**:

```javascript
// 错误写法 (src/lib/supabase.js)
const { data, error } = await supabase
  .from('player_stats')
  .select('*')
  .eq('user_id', userId)
  .single()  // 无结果时返回 406

// 正确写法
const { data, error } = await supabase
  .from('player_stats')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle()  // 无结果时返回 null
```

**自动修复命令**:

```bash
# 批量替换 .single() 为 .maybeSingle()
sed -i 's/\.single()/.maybeSingle()/g' src/lib/supabase.js
```

---

### 阶段 4.2: 排名系统实现

**数据库 (Supabase)**:
- 访问 https://supabase.com/dashboard/project/pjnzmyvoucgmanoqvbav
- 在 SQL Editor 中执行 `claude_docs/ranking_system.sql`
- 执行 `claude_docs/fix_rls_policy.sql` 修复 RLS 策略

**积分规则**:
| 模式 | 胜利 | 失败 | 平局 |
|------|------|------|------|
| PVP | +25 | -25 | 0 |
| PVE (人机) | +20 | -20 | 0 |

**段位系统**:
| 段位 | 积分范围 | 图标 |
|------|---------|------|
| 青铜 | 0-1199 | 🥉 |
| 白银 | 1200-1399 | 🥈 |
| 黄金 | 1400-1599 | 🥇 |
| 钻石 | 1600+ | 💎 |

**关键文件**:
- `src/lib/supabase.js` - 数据库操作
- `src/components/Modals/RankingModal.jsx` - 排名UI
- `src/utils/device.js` - 设备ID管理
- `src/utils/constants.js` - 段位定义

---

### 阶段 5: 代码审查

**安全检查项**:
- [ ] 移除 Git 历史中的敏感文件 (`.env`)
- [ ] CORS 配置正确 (生产环境不使用 `*`)
- [ ] 无硬编码的环境 ID
- [ ] 环境变量使用 `process.env`

**代码质量检查**:
- [ ] 修复闭包问题 (使用 useRef)
- [ ] 清理重复/备份文件
- [ ] ESLint 检查通过

---

### 阶段 6: 提交代码

**提交规范**:

```bash
# 添加文件
git add <文件列表>

# 提交 (使用约定式提交)
git commit -m "type: description

## 更新内容
- 变更1
- 变更2

## 修改的文件
- file1: 说明
- file2: 说明"
```

**type 类型**:
- `feat`: 新功能
- `fix`: 修复
- `refactor`: 重构
- `docs`: 文档
- `chore`: 维护
- `security`: 安全修复

---

### 阶段 7: 部署

**环境信息**:
- CloudBase 环境 ID: `codebuddy-9gu42kpn62ead2e2`
- 前端环境: `codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com`
- 后端环境: `wuziqi-server-227261-9-1402693592.sh.run.tcloudbase.com`

**部署命令**:

```bash
# 前端构建和部署
npm run build
npx cloudbase hosting:deploy dist -e codebuddy-9gu42kpn62ead2e2

# 后端部署
cd cloudbase/server
npx tcb cloudrun deploy -s wuziqi-server --port 3000 --source . --force

# 文档部署
npx tcb hosting deploy <文件> <远程名> -e codebuddy-9gu42kpn62ead2e2
```

---

## 常用快捷命令

| 命令 | 说明 |
|------|------|
| `npm start` | 同时启动前后端 |
| `npm run dev` | 只启动前端 |
| `npm run server` | 只启动后端 |
| `npm run build` | 生产构建 |
| `npm test` | 运行测试 |