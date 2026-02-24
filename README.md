# 五子棋游戏 (Gomoku)

一个精美的在线五子棋游戏，支持人机对战、双人对战等多种模式。

## 功能特性

### 游戏模式
- **双人对战** - 本地双人对战模式
- **人机对战** - 与内置 AI 对战
- **在线对战** - 创建/加入房间

### AI 智能对手
- **三种难度级别**：简单 / 中等 / 困难
  - **简单**：随机落子 + 基础进攻策略，适合新手练习
  - **中等**：偶尔失误的均衡对手，攻防兼顾
  - **困难**：Minimax + Alpha-Beta 剪枝算法，深度搜索，强力对手
- 智能攻守判断
- 优先占据中心位置

### 个性化
- **6种主题**：默认、木纹、海洋、森林、夜空、樱花
- **音效系统**：落子音效、胜利音效（可开关）
- **游戏记录**：自动保存到本地存储
- **回放功能**：查看对局过程

### 云端功能
- **云端存储** - 游戏记录自动同步到 Supabase 数据库
- **双记录系统** - 本地存储 + 云端存储双备份
- **在线对战预留** - 已集成实时订阅功能，支持未来在线对战

### 其他功能
- 最后落子高亮标记
- 悔棋功能
- 倒计时显示
- 胜负判定

## 技术栈

- **前端框架**: React 19
- **构建工具**: Vite 7
- **后端服务**: Supabase (PostgreSQL + Realtime)
- **部署平台**: 腾讯云 CloudBase

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 游戏规则

1. 黑白双方轮流在棋盘上落子
2. 黑棋先行
3. 率先在一条直线（横、竖、斜）上连成五子的一方获胜
4. 棋盘下满无子可落且无一方获胜，则为平局

## 项目结构

```
wuziqi/
├── src/
│   ├── components/
│   │   ├── Board/           # 棋盘组件
│   │   └── Modals/          # 模态框组件
│   │       ├── VictoryModal.jsx
│   │       ├── RulesModal.jsx
│   │       ├── SettingsModal.jsx
│   │       └── ReplayModal.jsx
│   ├── hooks/
│   │   └── useGameLogic.js  # 游戏逻辑 Hook
│   ├── lib/
│   │   └── supabase.js      # Supabase 客户端和操作函数
│   ├── utils/
│   │   ├── constants.js     # 常量配置
│   │   ├── ai.js            # AI 算法
│   │   └── sound.js         # 音效工具
│   ├── App.jsx              # 主应用组件
│   ├── App.css              # 主应用样式
│   ├── index.css            # 全局样式
│   └── main.jsx             # 入口文件
├── public/                  # 静态资源
├── index.html               # HTML 模板
├── .env                     # 环境变量配置
├── vite.config.js           # Vite 配置
└── package.json             # 项目配置
```

## 部署信息

- **在线地址**: https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com/
- **当前版本**: v0.8
- **部署时间**: 2026-02-24
- **部署平台**: 腾讯云 CloudBase 静态网站托管 + 云函数

### 部署步骤

```bash
# 1. 构建生产版本
npm run build

# 2. 部署前端到 CloudBase
npx cloudbase hosting:deploy dist -e codebuddy-9gu42kpn62ead2e2

# 3. 部署云函数 (可选，用于在线对战)
cloudbase fn deploy wuziqi-server -e codebuddy-9gu42kpn62ead2e2 --dir ./cloudfunctions/wuziqi-server --ws --force

# 4. 创建 HTTP 访问服务 (可选)
cloudbase service create -e codebuddy-9gu42kpn62ead2e2 -p wuziqi -f wuziqi-server
```

### 本次 v0.8 部署内容

- 部署前端到 CloudBase 静态托管
- 部署云函数 (wuziqi-server)
- 创建 HTTP 访问服务
- 更新版本号至 v0.8
- 保留云托管备份方案 (cloudbase_backup/)
- 添加云函数部署方案 (cloudfunctions/)

### 本次 v0.6 部署内容

- 新增在线对战功能（开发完成）
  - 新增后端服务器 Express + Socket.io
  - 实现创建房间、加入房间功能（6位房间码）
  - 实现实时棋盘同步
  - 前后端胜负判定
  - 前端在线游戏 Hook (useOnlineGame.js)
  - 房间 UI 组件 (RoomModal)
- 统一版本号至 v0.6
- 修复已知问题，优化游戏体验

## 版本历史

- **v0.8** - 部署到腾讯云 CloudBase
  - 前端部署到 CloudBase 静态托管
  - 云函数部署 (wuziqi-server)
  - 创建 HTTP 访问服务
  - 更新版本号至 v0.8
  - 保留云托管备份方案 (cloudbase_backup/)
  - 添加云函数部署方案 (cloudfunctions/)
- **v0.6** - 实现在线对战功能
  - 新增后端服务器 (Express + Socket.io)
  - 实现创建/加入房间功能（6位房间码）
  - 实时棋盘状态同步
  - 后端胜负判定逻辑
  - 新增 useOnlineGame.js Hook
  - 新增 RoomModal 房间管理组件
- **v0.51** - 实现 AI 难度系统
  - 新增三种 AI 难度级别：简单、中等、困难
  - 简单难度：随机性 + 基础进攻，适合新手
  - 中等难度：偶尔失误的均衡对手
  - 困难难度：Minimax + Alpha-Beta 剪枝算法
  - 设置面板支持实时切换难度
  - 切换难度后自动重置游戏
- **v0.5** - 重构组件结构，集成 Supabase 数据库
  - 拆分 App.jsx 从 765 行至模块化结构
  - 新增 hooks/useGameLogic 管理游戏状态
  - 提取 utils/ 文件夹存放工具函数
  - 优化 AI 候选位置算法，减少计算量
  - 集成 Supabase 数据库，实现云端存储
  - 创建 game_records 和 game_rooms 数据表
  - 添加本地/云端双记录系统
  - 预留在线对战实时同步接口
- **v0.4** - 修复按钮文字颜色可读性问题，优化非active状态按钮的对比度
- **v0.3** - 修复棋盘线条和AI落子问题
- **v0.2** - 添加AI对战、音效、主题和游戏记录功能
- **v0.1** - 初始版本

## 数据库表结构

### game_records (游戏记录表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| created_at | TIMESTAMP | 创建时间 |
| winner | TEXT | 获胜方 (black/white/draw) |
| game_mode | TEXT | 游戏模式 (pvp/pve/online) |
| moves | INTEGER | 总步数 |
| duration_seconds | INTEGER | 游戏时长(秒) |
| theme | TEXT | 主题 |
| move_history | JSONB | 棋谱数据 |

### game_rooms (在线对战房间表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| room_code | TEXT | 房间代码 |
| status | TEXT | 状态 (waiting/playing/finished) |
| player_black | TEXT | 黑棋玩家 |
| player_white | TEXT | 白棋玩家 |
| board_state | JSONB | 棋盘状态 |
| move_history | JSONB | 移动历史 |

---
## 本地运行示例

在项目根目录下运行以下命令启动开发服务器：

```bash
npm start
```

**预期输出：**

```
> xiaochidian@0.6.0 start
> concurrently "npm run dev" "npm run server"

[0] 
[0] > xiaochidian@0.6.0 dev
[0] > vite

[1] 
[1] > xiaochidian@0.6.0 server
[1] > node server/server.js

[1] ========================================
[1] 🎮 五子棋在线对战服务器已启动
[1] 📡 监听端口: 3001
[1] 🌐 前端连接地址: http://localhost:5173
[1] ========================================

[0]   VITE v7.3.1  ready in XXX ms
[0] 
[0]   ➜  Local:   http://localhost:5173/
[0]   ➜  Network: use --host to expose
```

启动成功后：
- 前端地址: http://localhost:5173
- 后端服务器: http://localhost:3001



© 2026 狮王李
