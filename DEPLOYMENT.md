# 五子棋后端服务器部署配置指南

## 环境信息

| 项目 | 值 |
|------|-----|
| 环境 ID | `codebuddy-9gu42kpn62ead2e2` |
| 云托管服务名 | `wuziqi-server` |
| 前端域名 | `https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com` |

---

## 方法一：通过控制台设置（推荐）

### 步骤 1：登录腾讯云 CloudBase 控制台

1. 访问：https://console.cloud.tencent.com/tcb
2. 点击左侧菜单 **云托管** → **服务管理**
3. 找到服务 `wuziqi-server`

### 步骤 2：添加环境变量

1. 点击服务名称 `wuziqi-server` 进入详情页
2. 选择 **版本管理** 标签
3. 点击当前版本右侧的 **编辑** 按钮（或 **新建版本**）
4. 在 **环境变量** 区域，点击 **添加**
5. 添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ALLOWED_ORIGIN` | `https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com` | 允许跨域的前端域名 |
| `TCB_ENV_ID` | `codebuddy-9gu42kpn62ead2e2` | CloudBase 环境 ID |
| `NODE_ENV` | `production` | 生产环境标识 |

6. 点击 **保存** 按钮
7. 点击 **部署** 按钮使配置生效

### 步骤 3：验证配置

部署完成后，访问后端服务查看日志：
- 访问：https://console.cloud.tencent.com/tcb → 云托管 → 服务列表 → wuziqi-server → 日志
- 确认日志中显示：`[配置] CORS origin: https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com`
- 确认 **没有** `[安全警告] 未配置 ALLOWED_ORIGIN` 警告

---

## 方法二：使用 CloudBase CLI 设置

### 安装 CLI

```bash
npm install -g @cloudbase/cli
```

### 登录

```bash
tcb login
```

### 设置环境变量

```bash
# 设置 ALLOWED_ORIGIN
tcb cloudrun update-env wuziqi-server \
  ALLOWED_ORIGIN="https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com" \
  -e codebuddy-9gu42kpn62ead2e2

# 设置 TCB_ENV_ID
tcb cloudrun update-env wuziqi-server \
  TCB_ENV_ID="codebuddy-9gu42kpn62ead2e2" \
  -e codebuddy-9gu42kpn62ead2e2

# 设置 NODE_ENV
tcb cloudrun update-env wuziqi-server \
  NODE_ENV="production" \
  -e codebuddy-9gu42kpn62ead2e2
```

### 验证环境变量

```bash
tcb cloudrun describe-env -e codebuddy-9gu42kpn62ead2e2
```

---

## 常见问题

### Q1: 设置后仍然显示 CORS 警告？

A: 请检查：
1. 环境变量是否保存成功
2. 是否已重新部署服务（编辑环境变量后需要重新部署）
3. 等待 1-2 分钟让配置生效

### Q2: 如何查看当前环境变量？

A: 在 CloudBase 控制台：
1. 云托管 → 服务管理 → wuziqi-server
2. 版本管理 → 当前版本 → 点击查看详情
3. 可以看到已配置的环境变量列表

### Q3: 前端域名变更了怎么办？

A: 重复上述步骤 2，修改 `ALLOWED_ORIGIN` 的值为新域名即可。

---

## 安全提醒

1. ⚠️ **立即轮换 Supabase 密钥**
   - 访问：https://pjnzmyvoucgmanoqvbav.supabase.co
   - 进入 Project Settings → API
   - 点击 "Regenerate" 重新生成 `anon public` key
   - 更新 Supabase 配置后，同时更新此项目的 `.env.example` 文件

2. ⚠️ **不要提交敏感文件**
   - 确保 `.env` 和 `.env.production` 未被提交到 Git
   - 已在 `.gitignore` 中配置排除

---

*文档更新时间：2026-03-05*
