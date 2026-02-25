# CloudBase 云托管部署指南

## 目录结构

```
cloudbase/
├── server/                 # 云托管后端服务
│   ├── package.json
│   ├── server.js           # 服务器主文件
│   └── utils/
│       └── gameLogic.js    # 游戏逻辑
└── DEPLOY_GUIDE.md         # 本部署指南
```

## 部署步骤

### 1. 前端部署 (静态网站托管)

```bash
# 构建前端
npm run build

# 部署到 CloudBase
npx cloudbase hosting:deploy dist -e codebuddy-9gu42kpn62ead2e2
```

### 2. 后端部署 (云托管 - 容器型)

> **重要**：必须使用「容器型」部署，而非「函数型」！

#### 方式一：通过 CloudBase 控制台部署

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 进入「云托管」页面
3. 点击「创建服务」
4. 填写配置：
   - 服务名称：`wuziqi-server`
   - 地域：上海
   - 部署方式：选择「容器型」

5. 点击「创建版本」
6. 填写容器配置：
   - 镜像：选择「手动上传」
   - 代码包：上传 `cloudbase/server/` 目录
   - 端口：`3000`
   - 环境变量：
     ```
     ALLOWED_ORIGIN=*
     ```

7. 创建流量策略：
   - 流量入口：HTTP/HTTPS
   - 分配策略：默认轮询

#### 方式二：通过 CLI 部署（容器型）

```bash
# 安装 CloudBase CLI (如果未安装)
npm install -g @cloudbase/cli

# 登录
tcb login

# 部署服务（容器型）
cd cloudbase/server
tcb cloudrun deploy -e codebuddy-9gu42kpn62ead2e2 -s wuziqi-server --port 3000 --force
```

### 3. 获取后端服务地址

部署完成后，在云托管控制台获取服务地址，格式类似：
```
wuziqi-server-xxx.service-xxx.tcbns.tencentyun.com
```

或：
```
wuziqi-server-xxx-xxx-xxxxxx.sh.run.tcloudbase.com
```

### 4. 配置前端环境变量

在部署前端之前，需要设置环境变量：

**方式一：构建时设置**
```bash
# .env.production
VITE_SOCKET_URL=https://你的云托管服务地址
```

然后重新构建部署：
```bash
npm run build
npx cloudbase hosting:deploy dist -e codebuddy-9gu42kpn62ead2e2
```

**方式二：修改代码使用相对路径**

前端代码已配置为在生产环境下自动使用同源地址，无需额外配置。

### 5. 配置 CORS

确保 CloudBase 后端服务的环境变量 `ALLOWED_ORIGIN` 设置为你的前端域名，例如：
```
ALLOWED_ORIGIN=https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com
```

---

## 环境变量说明

### 后端环境变量

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| ALLOWED_ORIGIN | 是 | 允许的跨域请求源 | https://your-domain.com 或 * |
| NODE_ENV | 否 | 运行环境 | production |
| PORT | 否 | 监听端口 (CloudBase自动设置) | 3000 |

### 前端环境变量

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| VITE_SOCKET_URL | 否 | Socket.io 服务器地址 | https://your-server.com |
| VITE_SUPABASE_URL | 是 | Supabase 项目 URL | https://xxx.supabase.co |
| VITE_SUPABASE_ANON_KEY | 是 | SupabaseAnon Key | eyJxxx |

---

## 本地测试

### 本地后端服务

```bash
cd cloudbase/server
npm install
node index.js
# 后端运行在 http://localhost:3000
```

### 本地前端服务

```bash
npm run dev
# 前端运行在 http://localhost:5173
```

---

## 故障排查

### 1. 连接失败

- 检查后端服务是否正常运行
- 检查 CORS 配置是否正确
- 检查前端 VITE_SOCKET_URL 是否正确
- **重要**：确保使用「容器型」部署而非「函数型」

### 2. WebSocket 连接失败

- 确保 CloudBase 云托管已正确配置 WebSocket
- 检查是否使用了正确的协议 (wss://)
- 检查端口配置是否为 3000

### 3. 容器部署失败 (Liveness probe failed)

- 确保服务器代码监听的是端口 3000（CloudBase 默认端口）
- 确保导出 main 函数（如果使用函数型部署）
- 推荐使用容器型部署，避免函数型的限制

### 4. 房间创建/加入失败

- 检查后端日志
- 确保两玩家使用相同房间号
