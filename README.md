# 五子棋游戏 (Gomoku) - xiaochidian

一个精美的在线五子棋游戏，支持人机对战、双人对战、在线对战等多种模式。

> **项目名称**: xiaochidian - 来源于 `package.json` 中的 `name` 字段，作为项目的唯一标识符

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
- **在线对战服务器** - 使用 CloudBase 云托管部署，支持 WebSocket 实时通信

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

### 启动开发服务器
```bash
npm start
```
- 前端：http://localhost:5173
- 后端：http://localhost:3000

## 在线对战使用指南

### 创建房间
1. 在游戏主界面点击「在线对战」按钮
2. 点击「创建房间」按钮
3. 系统会自动生成一个 6 位房间号（如：`ABC123`）
4. 将房间号分享给朋友
5. 等待对手加入

### 加入房间
1. 在游戏主界面点击「在线对战」按钮
2. 输入房主提供的 6 位房间号
3. 点击「加入房间」按钮
4. 等待游戏开始

### 房间号规则
- 房间号由 6 位字母和数字组成（如：`ABC123`, `XY5678`）
- 字母使用大写，排除易混淆字符（I, O, 0, 1）
- 房间号唯一，不可重复

### 退出房间
- 点击「退出房间」按钮即可离开当前房间
- 如果是房主退出，房间会自动解散
- 如果是玩家退出，对方会收到「对手已离开」通知

### 游戏规则
- 黑棋先行（房主执黑）
- 白棋后行（加入者执白）
- 率先连成五子者获胜
- 支持重新开始游戏

### 注意事项
- 在线对战需要两端都连接互联网
- 确保防火墙允许 5173 和 3000 端口
- 局域网内可直接使用内网 IP 访问

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
│   │   │   ├── Board.jsx
│   │   │   └── Board.css
│   │   └── Modals/          # 模态框组件
│   │       ├── VictoryModal.jsx
│   │       ├── RulesModal.jsx
│   │       ├── SettingsModal.jsx
│   │       ├── ReplayModal.jsx
│   │       └── RoomModal.jsx
│   ├── hooks/
│   │   ├── useGameLogic.js  # 游戏逻辑 Hook
│   │   └── useOnlineGame.js # 在线对战 Hook
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
├── cloudbase/
│   ├── server/              # CloudBase 云托管后端
│   │   ├── index.js         # 云函数入口
│   │   ├── server.js        # 服务器主逻辑
│   │   ├── utils/
│   │   │   └── gameLogic.js # 游戏逻辑
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── cloudbaserc.json
│   └── DEPLOY_GUIDE.md     # 部署指南
├── public/                  # 静态资源
├── index.html               # HTML 模板
├── .env                    # 开发环境变量
├── .env.production         # 生产环境变量
├── vite.config.js           # Vite 配置
└── package.json             # 项目配置
```

## 部署信息

- **在线地址**: https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com/
- **当前版本**: v1.2.3
- **部署时间**: 2026-03-03
- **后端服务**: wuziqi-server (容器型云托管) - 运行正常
- **后端版本**: wuziqi-server-001
- **后端地址**: wuziqi-server-227261-9-1402693592.sh.run.tcloudbase.com
- **部署平台**: 腾讯云 CloudBase 静态网站托管 + 云托管

### 当前状态

- ✅ **游戏功能**: 在线对战完全正常
- ✅ **WebSocket**: 实时通信正常
- ⚠️ **数据库**: 使用内存存储（容器重启后数据丢失）

### 数据库配置说明

**当前状态**：
- 服务使用内存存储房间数据
- 容器重启后房间数据会丢失
- 游戏对战功能完全正常

**未来持久化配置（可选）**：

如需实现排行榜、历史战绩等持久化功能，需要配置 VPC 网络让容器访问 CloudBase 数据库：

1. 进入 [CloudBase 控制台](https://console.cloud.tencent.com/tcb) - 云托管
2. 点击 wuziqi-server 服务 - 服务设置
3. 启用「私有网络 (VPC)」
4. 选择或创建 VPC 网络
5. 重新部署服务

配置成功后，容器即可通过 VPC 访问 CloudBase NoSQL 数据库，实现数据持久化。

### 部署步骤

```bash
# 1. 构建生产版本
npm run build

# 2. 部署前端到 CloudBase
npx cloudbase hosting:deploy dist -e codebuddy-9gu42kpn62ead2e2

# 3. 部署后端到 CloudBase 云托管
# 方式一：使用 CloudBase CLI
tcb cloudrun deploy -s wuziqi-server --port 3000 --source ./cloudbase/server --force

# 方式二：进入 server 目录后部署
cd cloudbase/server
tcb cloudrun deploy -s wuziqi-server --port 3000 --source . --force

# 4. 部署云函数 (可选，用于在线对战)
cloudbase fn deploy wuziqi-server -e codebuddy-9gu42kpn62ead2e2 --dir ./cloudfunctions/wuziqi-server --ws --force

# 5. 创建 HTTP 访问服务 (可选)
cloudbase service create -e codebuddy-9gu42kpn62ead2e2 -p wuziqi -f wuziqi-server
```

### 本次 v1.0 部署内容

- 成功部署 CloudBase 云托管后端服务器
- 后端服务：wuziqi-server (函数型云托管) - 运行正常
- 后端服务地址：wuziqi-server-227261-9-1402693592.sh.run.tcloudbase.com
- 在线对战功能正式上线！
- 前后端 WebSocket 连接成功
- 更新版本号至 v1.0

**部署日志：**
```
node server.js

[配置] CORS origin: *
========================================
🎮 五子棋在线对战服务器已启动 (CloudBase版)
📡 监听端口: 3000
🌐 环境: development
========================================

tcb cloudrun deploy -e codebuddy-9gu42kpn62ead2e2 -s wuziqi-server --port 3000 --force
CloudBase CLI 2.12.2
试试 tcb ai 命令，开启 AI 原生开发
i 当前环境 Id：codebuddy-9gu42kpn62ead2e2
? 是否启用灰度部署？ 否（发布成功后自动切换流量至新版本）
i 正在提交函数型云托管 wuziqi-server 中，请稍候...
i 提交函数型云托管 wuziqi-server 已完成！
┌───────────────┬────────────┬─────────────────────┬──────────┬──────────┐
│ 服务名称      │ 类型       │ 更新时间            │ 运行状态 │ 公网访问 │
├───────────────┼────────────┼─────────────────────┼──────────┼──────────┤
│ wuziqi-server │ 函数型服务 │ 2026-02-25 02:03:50 │ normal   │ 允许     │
└───────────────┴────────────┴─────────────────────┴──────────┴──────────┘
```

### 本次 v1.2 部署内容 (2026-02-27)

| 修复项 | 问题描述 | 解决方案 | 效果 |
|--------|----------|----------|------|
| **断线重连缓冲期** | `disconnect` 定时器60秒，`getDisconnectedUser` 检查10秒，不匹配 | 统一为60秒缓冲期 | 手机端断线后可正常恢复房间 |
| **数据库操作阻塞** | `create_room`、`join_room`、`place_piece` 中的 `await dbSaveRoom()` 阻塞响应 | 改为后台异步执行 | 创建/加入/落子即时响应 |
| **数据库查询** | `place_piece` 尝试从数据库加载房间，等待超时 | 完全移除数据库查询依赖 | 纯内存操作，无延迟 |
| **落子高亮** | 手机端自己落子后高亮不显示，需等服务端响应 | 乐观更新：本地立即更新棋盘状态 | 自己落子立即显示高亮 |
| **代码优化** | `placePiece` 闭包陷阱，回滚状态可能过期 | 使用函数式更新获取最新状态 | 回滚机制更可靠 |

#### 优化效果
- ✅ 创建房间：即时响应，立即显示房间号
- ✅ 加入房间：即时响应，立即进入游戏
- ✅ 落子：即时响应，棋子立即显示，高亮即时显示
- ✅ 断线重连：60秒内可正常恢复房间状态

#### 代码审查报告 (2026-02-27)

##### 发现的问题

| 严重程度 | 位置 | 问题描述 |
|----------|------|----------|
| **CRITICAL** | `src/hooks/useOnlineGame.js:417-436` | 乐观更新缺少回滚机制 - 落子被服务器拒绝时不会回滚本地状态 |
| WARNING | `cloudbase/server/index.js:554,603` | `disconnectedUsers` 和 `disconnectTimeouts` 对象可能内存泄漏 |
| WARNING | `cloudbase/server/index.js:510,530` | 数据库保存失败无重试机制 |

##### 已修复
- ✅ **CRITICAL**: 乐观更新回滚机制 - 落子被服务器拒绝时自动回滚本地状态

##### 待修复 (后续版本)
- 断线用户对象定期清理机制
- 数据库保存重试机制

### 本次 v1.2.3 部署内容 (2026-03-03)

**v1.2.3 - 回放模式优化 + Bug 修复**

#### 功能更新
- ✅ 新增回放模式毛玻璃效果
- ✅ 新增回放模态框拖拽功能（支持鼠标和触摸）
- ✅ 修复回放后AI不继续下棋的bug
- ✅ 修复 turnTime 变量作用域错误
- ✅ 使用 refs 追踪最新状态，避免闭包陷阱
- ✅ PVE模式下增加权限检查，防止用户在AI回合落子

#### Bug 修复
| 修复项 | 问题描述 | 解决方案 |
|--------|----------|----------|
| **回放后AI不落子** | 退出回放后PVE模式下AI不继续下棋 | 新增 resetAiMove 和 triggerAiMove 函数控制AI落子 |
| **ReferenceError** | turnTime 变量在 if 块外未定义 | 将变量声明移至 if 块外 |
| **闭包陷阱** | AI落子时使用过期的状态值 | 使用 refs 追踪最新状态值 |

#### 修改的文件
| 文件路径 | 修改内容 |
|----------|----------|
| `src/hooks/useGameLogic.js` | 重构AI落子逻辑，修复闭包问题 |
| `src/App.jsx` | 增强回放状态恢复逻辑 |
| `src/components/Modals/ReplayModal.jsx` | 新增拖拽功能 |
| `src/App.css` | 毛玻璃效果样式 |
| `src/hooks/__tests__/replay.test.jsx` | 新增回放功能测试 |
| `index.html` | 版本号更新至 v1.2.3 |
| `package.json` | 版本号更新至 v1.2.3 |

### 本次 v1.2.1 部署内容 (2026-02-27)

**v1.2.1 - 在线对战计时器功能 + Bug 修复**

#### 更新内容
- ✅ 新增在线对战计时器功能
- ✅ 实时显示游戏总时间
- ✅ 分别追踪黑方和白方累计落子时间
- ✅ 获胜页面正确显示所有时间数据
- ✅ 修复时间不走动的 bug
- ✅ 修复获胜页面不显示时间的 bug

#### Bug 修复 (2026-02-28)
| 修复项 | 问题描述 | 解决方案 |
|--------|----------|----------|
| **计时器精度问题** | `useEffect` 依赖数组包含 `blackTime` 和 `whiteTime`，导致计时器每秒被重置 | 从依赖数组中移除时间状态，使用 refs 追踪时间 |
| **竞态条件** | 两个独立的 `useEffect` 处理回合切换和计时器，存在竞态条件 | 合并为一个 `useEffect`，使用 `prevTurnRef` 追踪回合变化 |

#### 修改的文件
| 文件路径 | 修改内容 |
|----------|----------|
| `cloudbase/server/server.js` | 后端计时器逻辑 |
| `cloudbase/server/utils/gameLogic.js` | 房间初始化添加时间字段 |
| `cloudbase/server/index.js` | 时间计算与同步 |
| `src/hooks/useOnlineGame.js` | 前端计时器与状态管理（修复依赖数组问题） |
| `src/App.jsx` | 版本号更新至 v1.2.1 |
| `index.html` | 版本号更新至 v1.2.1 |

#### 技术细节
- 游戏开始时自动启动计时器
- 每次落子时更新当前方累计时间
- 时间数据通过 WebSocket 实时同步
- 获胜时计算准确的游戏总时间和各方累计时间
- **关键修复**：使用 `useRef` 而非 `useState` 追踪时间，避免不必要的 effect 重新执行

### 本次 v1.1 部署内容 (2026-02-26)

#### 问题描述
服务器日志出现以下错误：
```
ReferenceError: dbInitFailed is not defined
[数据库] 保存房间失败: dbInitFailed is not defined
[数据库] 删除房间失败: dbInitFailed is not defined
```

#### 问题分析
1. 在 `cloudbase/server/utils/database.js` 第58行使用了 `dbInitFailed` 变量，但没有在文件开头声明
2. 在 `cloudbase/server/index.js` 中缺少 `setSocketEmitter` 调用，导致数据库状态无法通知客户端

#### 修复步骤

**步骤1：修复 database.js 变量声明**
```javascript
// 修改前 (cloudbase/server/utils/database.js 第13-15行)
let app, db
let io = null  // Socket.io 实例

// 修改后
let app, db
let dbInitFailed = false  // 数据库初始化失败标记
let io = null  // Socket.io 实例
```

**步骤2：修复 index.js 缺少的调用**
```javascript
// 添加导入 (cloudbase/server/index.js)
import {
  getRoom as dbGetRoom,
  saveRoom as dbSaveRoom,
  deleteRoom as dbDeleteRoom,
  initDatabase,
  setSocketEmitter  // 新增
} from './utils/database.js'

// 在创建 io 实例后添加调用
const io = new Server(httpServer, {...})
setSocketEmitter(io)  // 新增
```

**步骤3：重新部署到 CloudBase**
```bash
npx cloudbase run:deploy -e codebuddy-9gu42kpn62ead2e2 -s wuziqi-server --targetPath ./cloudbase/server
```

#### 修复结果
- 新版本：wuziqi-server-031
- 部署时间：2026-02-26 23:36:17
- 服务状态：normal ✅
- 游戏功能正常运行

#### 注意事项
- 由于 CloudBase 云托管环境无法创建数据库集合（需要更高权限），当前使用内存存储
- 房间数据在容器重启后会丢失，但游戏对战功能正常
- 如需持久化存储，需要在 CloudBase 控制台手动创建 `wuziqi_rooms` 集合

### 本次 v0.8 部署内容

- 部署前端到 CloudBase 静态托管
- 部署云函数 (wuziqi-server)
- 创建 HTTP 访问服务
- 更新版本号至 v0.8
- 保留云托管备份方案 (cloudbase_backup/)
- 添加云函数部署方案 (cloudfunctions/)

### 在线对战配置说明

**当前状态**：
- 云函数部署遇到配置问题
- CloudBase 云托管需要开通按流量计费（包年包月无法使用）
- 云函数不支持 WebSocket，无法实现真正的实时在线对战

**结论**：
- 当前版本只支持本地双人对战和人机对战
- 在线对战功能需要使用其他方案（如自建服务器）

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

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| **v1.2.3** | 2026-03-03 | 回放模式优化（毛玻璃+拖拽），修复回放后AI不落子 |
| **v1.2.1** | 2026-02-27 | 新增在线对战计时器功能，实时显示游戏时间和双方累计时间 |
| **v1.2** | 2026-02-27 | 修复断线重连缓冲期、数据库阻塞、落子高亮等问题，详见上方更新详情 |
| **v1.1** | 2026-02-26 | 修复数据库初始化问题 |
- **v1.2.1** - 在线对战计时器功能 (2026-02-27)
  - 新增在线对战计时器功能
  - 实时显示游戏总时间
  - 分别追踪黑方和白方累计落子时间
  - 获胜页面正确显示所有时间数据
  - 修复时间不走动的 bug
  - 修复获胜页面不显示时间的 bug
- **v1.1** - 修复数据库初始化问题 (2026-02-26)
  - 修复 `dbInitFailed is not defined` 错误
  - 添加缺失的变量声明 `let dbInitFailed = false`
  - 修复 index.js 缺少的 `setSocketEmitter` 调用
  - 重新部署到 CloudBase (wuziqi-server-031)
  - 当前使用内存存储房间数据（容器重启后丢失）
- **v1.0** - CloudBase 云托管部署成功，在线对战正式上线
  - 成功部署 CloudBase 云托管后端服务器（容器型）
  - 后端服务地址：wuziqi-server-227261-9-1402693592.sh.run.tcloudbase.com
  - 在线对战功能正式可用
  - 前后端 WebSocket 连接成功
  - 更新版本号至 v1.0
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
> xiaochidian@1.0.0 start
> concurrently "npm run dev" "npm run server"

[0] 
[0] > xiaochidian@1.0.0 dev
[0] > vite

[1] 
[1] > xiaochidian@1.0.0 server
[1] > node cloudbase/server/index.js

[1] 🎮 五子棋在线对战服务器已启动
[1] 📡 监听端口: 3000

[0]   VITE v7.3.1  ready in XXX ms
[0] 
[0]   ➜  Local:   http://localhost:5173/
[0]   ➜  Network: http://192.168.1.9:5173/
[0]   ➜  Network: http://192.168.1.8:5173/
```

启动成功后：
- 前端地址: http://localhost:5173
- 后端服务器: http://localhost:3000

### 局域网访问

如需从局域网其他设备访问，需要：

1. **添加防火墙规则（管理员权限）**：
```cmd
netsh advfirewall firewall add rule name="Vite Port 5173" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="Node Server Port 3000" dir=in action=allow protocol=TCP localport=3000
```

2. 在其他设备上访问 `http://[本机IP地址]:5173`
   - 例如：`http://192.168.1.9:5173`

## 线上部署信息

### 部署地址

| 服务 | 地址 |
|------|------|
| 前端（静态网站） | https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com/ |
| 后端（云托管） | https://wuziqi-server-227261-9-1402693592.sh.run.tcloudbase.com |

### 部署时间
- 2026-03-01

### CloudBase 资源
- 环境 ID：codebuddy-9gu42kpn62ead2e2
- 云托管服务：wuziqi-server（容器型，端口 3000）
- 静态网站托管：codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com

© 2026 狮王李
