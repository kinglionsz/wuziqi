# 腾讯云函数部署指南

## 重要说明

⚠️ **云函数版本 limitations**:
- 云函数是无状态服务，冷启动后会重置内存数据
- 云函数不支持 WebSocket 长连接
- **建议**: 如果需要真正的在线对战功能，需要使用 **腾讯云 CloudBase 云托管** 或 **CVM 自建服务器**

---

## 本部署方案说明

此版本使用 HTTP API 代替 WebSocket，**仅支持单设备对战**（双人对战/人机对战），不适合真正的在线对战。

### 为什么云函数不适合实时对战？

1. **无状态**: 每次请求可能分配到不同实例，房间数据无法持久化
2. **无 WebSocket**: 实时对战需要长连接，云函数只支持 HTTP
3. **冷启动**: 首次调用有延迟

---

## 如果需要真正的在线对战

推荐以下方案：

### 方案 1: CloudBase 云托管 (推荐)
- 需要先在 CloudBase 控制台开通云托管服务
- 参考 `cloudbase_backup/` 中的部署方案

### 方案 2: 腾讯云 CVM
- 购买云服务器 (CVM)
- 在服务器上运行 Node.js 后端服务
- 使用 Nginx 反向代理

---

## 当前版本功能

此云函数版本支持：
- ✅ 健康检查: `/health`
- ✅ 创建房间 API: `/api/create_room`
- ✅ 加入房间 API: `/api/join_room`
- ✅ 落子 API: `/api/place_piece`
- ❌ 实时同步 (需要 WebSocket)

---

## 部署步骤 (如果仍要部署)

### 1. 安装 SCF CLI

```bash
npm install -g @serverless/cli
# 或
npm install -g tencent-cloud-sdk
```

### 2. 创建 serverless.yml

```yaml
component: scf
name: wuziqi-server
inputs:
  name: wuziqi-server
  region: ap-guangzhou
  runtime: Nodejs12.16
  timeout: 60
  memorySize: 128
  events:
    - apigw:
        name: wuziqi-api
        integratedAutoAuth: true
        parameters:
          protocols:
            - http
          method: ANY
          path: /
```

### 3. 部署

```bash
serverless deploy
```

### 4. 获取 API 地址

部署完成后获取 API Gateway 地址。

---

## 结论

**此云函数版本不推荐用于在线对战**。如果想要真正的在线对战功能，请在 CloudBase 控制台开通云托管服务，然后使用 `cloudbase_backup/` 中的方案部署。
