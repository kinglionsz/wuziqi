# CloudBase MCP 部署快速参考

## 环境信息
- 环境 ID: `codebuddy-9gu42kpn62ead2e2`
- 静态域名: `codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com`
- 后端域名: `wuziqi-server-227261-9-1402693592.sh.run.tcloudbase.com`

## 项目路径
- 后端代码: `D:\ampa_migra\G\CodeSources\ai_project\codebuddy_project\wuziqi\cloudbase\server`
- 前端构建: `D:\ampa_migra\G\CodeSources\ai_project\codebuddy_project\wuziqi\dist`

## MCP 工具调用模板

### 1. 查询环境信息
```
mcp__cloudbase__envQuery({ action: "info" })
```

### 2. 部署后端 (CloudRun)
```json
{
  "action": "deploy",
  "force": true,
  "serverName": "wuziqi-server",
  "serverType": "container",
  "targetPath": "D:\\ampa_migra\\G\\CodeSources\\ai_project\\codebuddy_project\\wuziqi\\cloudbase\\server",
  "serverConfig": {
    "Cpu": 0.5,
    "Mem": 1,
    "MinNum": 1,
    "MaxNum": 3,
    "Port": 3000,
    "OpenAccessTypes": ["PUBLIC"]
  }
}
```

### 3. 部署前端 (静态托管)
```json
{
  "localPath": "D:\\ampa_migra\\G\\CodeSources\\ai_project\\codebuddy_project\\wuziqi\\dist",
  "cloudPath": "",
  "ignore": ["node_modules/**", ".git/**"]
}
```

### 4. 查询后端状态
```json
{
  "action": "detail",
  "detailServerName": "wuziqi-server"
}
```

### 5. 列出云托管服务
```json
{
  "action": "list",
  "pageNum": 1,
  "pageSize": 10
}
```

## 常用操作

| 操作 | MCP 工具 | 参数 |
|------|---------|------|
| 部署后端 | `manageCloudRun` | action: "deploy" |
| 更新后端 | `manageCloudRun` | action: "deploy", force: true |
| 删除后端 | `manageCloudRun` | action: "delete", force: true |
| 部署前端 | `uploadFiles` | localPath + cloudPath: "" |
| 查询环境 | `envQuery` | action: "info" |

## 注意事项

1. 后端代码必须包含 `Dockerfile`
2. 部署前端时 `cloudPath` 设为空字符串 "" 表示根目录
3. 首次部署使用 `force: true` 跳过确认
4. 部署完成后 CDN 需要几分钟生效