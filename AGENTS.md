# AGENTS.md - 五子棋游戏项目指南

## 项目概述

这是一个精美的在线五子棋（Gomoku）游戏项目，支持多种游戏模式和功能。

### 项目信息
- **项目名称**: xiaochidian
- **版本**: v1.2.7
- **类型**: Web 应用（React + Node.js）
- **在线地址**: https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com/

---

## 技术栈

### 前端
- **框架**: React 19
- **构建工具**: Vite 7
- **样式**: Tailwind CSS 4, CSS
- **测试**: Vitest, React Testing Library

### 后端
- **运行时**: Node.js
- **实时通信**: Socket.io
- **数据库**: Supabase (PostgreSQL)
- **部署平台**: 腾讯云 CloudBase

---

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
# 启动前后端（同时运行）
npm start

# 仅启动前端
npm run dev

# 仅启动后端
npm run server
```

### 构建生产版本
```bash
npm run build
```

### 测试
```bash
npm test        # 交互式测试
npm run test:run   # 运行测试
npm run test:coverage  # 测试覆盖率
```

### 排名数据库测试
```bash
node test_ranking_db.js    # 数据库功能测试
node test_ranking_playwright.js  # Playwright E2E测试
```

---

## 项目结构

```
wuziqi/
├── src/                      # 前端源代码
│   ├── components/           # React 组件
│   │   ├── Board.jsx        # 棋盘组件
│   │   ├── Board.css        # 棋盘样式
│   │   ├── Footer.tsx       # 页脚组件
│   │   ├── Navbar.tsx       # 导航栏组件
│   │   └── Modals/          # 模态框组件
│   │       ├── VictoryModal.jsx    # 胜利弹窗
│   │       ├── RulesModal.jsx      # 规则弹窗
│   │       ├── SettingsModal.jsx  # 设置弹窗
│   │       ├── ReplayModal.jsx     # 回放弹窗
│   │       ├── RoomModal.jsx       # 房间弹窗
│   │       └── RankingModal.jsx    # 排名弹窗
│   ├── hooks/               # React Hooks
│   │   ├── useGameLogic.js  # 游戏逻辑（核心）
│   │   └── useOnlineGame.js # 在线对战逻辑
│   ├── utils/               # 工具函数
│   │   ├── ai.js           # AI 算法
│   │   ├── constants.js    # 常量配置
│   │   ├── sound.js        # 音效工具
│   │   └── cloudbase.ts    # CloudBase 工具
│   ├── lib/                # 库文件
│   │   └── supabase.js     # Supabase 客户端
│   ├── pages/              # 页面组件
│   ├── assets/             # 静态资源
│   ├── __tests__/          # 组件测试
│   ├── App.jsx             # 主应用组件
│   ├── App.css             # 主应用样式
│   ├── index.css           # 全局样式
│   └── main.jsx            # 入口文件
├── cloudbase/              # CloudBase 后端
│   ├── server/              # 云托管后端
│   │   ├── index.js        # 入口文件
│   │   ├── server.js       # 主服务器逻辑
│   │   ├── utils/
│   │   │   ├── gameLogic.js # 游戏逻辑
│   │   │   └── database.js  # 数据库操作
│   │   └── package.json
│   └── DEPLOY_GUIDE.md     # 部署指南
├── tests/                  # 测试文件
├── public/                 # 静态资源
├── dist/                   # 构建输出
├── node_modules/           # 依赖
└── package.json            # 项目配置
```

---

## 核心模块说明

### 1. 游戏逻辑 (useGameLogic.js)

**职责**: 管理本地游戏的所有状态和操作

**主要状态**:
- `board` - 15x15 棋盘数组
- `currentPlayer` - 当前玩家 (black/white)
- `gameOver` - 游戏是否结束
- `winner` - 获胜方
- `moveHistory` - 落子历史记录
- `gameTime` - 游戏时间

**主要函数**:
- `handleCellClick(row, col)` - 处理落子
- `resetGame()` - 重置游戏
- `undoMove()` - 悔棋
- `saveGameRecord()` - 保存游戏记录

### 2. AI 算法 (ai.js)

**三种难度级别**:
- **简单** (`easy`): 30% 随机 + 70% 基础评估
- **中等** (`medium`): 85% 标准评估 + 15% 失误
- **困难** (`hard`): Minimax + Alpha-Beta 剪枝

**核心函数**:
- `findBestMove(board, player, level)` - 找到最佳落子位置
- `evaluatePosition(board, player)` - 评估位置分数
- `checkWinner(board, row, col, player)` - 检查胜负

### 3. 在线对战 (useOnlineGame.js)

**职责**: 管理在线对战的所有状态和操作

**主要状态**:
- `roomInfo` - 房间信息
- `gameState` - 游戏状态（棋盘、玩家、时间等）
- `isConnected` - WebSocket 连接状态

**主要函数**:
- `createRoom()` - 创建房间
- `joinRoom(code)` - 加入房间
- `placePiece(row, col)` - 落子
- `restartGame()` - 重新开始
- `leaveRoom()` - 离开房间
- `joinAsSpectator(code)` - 以观众身份加入观战

### 4. 排名系统

**主要功能**:
- 玩家排行榜 (积分、胜率、段位)
- 段位系统: 青铜、白银、黄金、钻石、王者
- 战绩统计 (总场次、胜率、连胜数)

**核心模块**:
- `RankingModal.jsx` - 排名 UI 组件
- `src/utils/device.js` - 设备 ID 管理
- `src/utils/constants.js` - 段位定义 (RANKS)

### 5. 常量配置 (constants.js)

```javascript
AI_PLAYER = 'white'     // AI 始终执白棋
BOARD_SIZE = 15          // 棋盘大小
GAME_MODES = { PVP, PVE, ONLINE }  // 游戏模式
AI_LEVELS = { EASY, MEDIUM, HARD } // AI 难度
THEMES = { default, wood, ocean, forest, night, pink }  // 主题
```

---

## 开发规范

### 代码风格
- 使用 ESLint 进行代码检查
- 使用 Prettier 格式化代码
- React Hooks 规则：确保依赖数组完整

### 组件规范
- 函数组件优先
- 使用 Hooks 管理状态
- 组件文件命名: `ComponentName.jsx` / `ComponentName.tsx`
- 样式文件: `ComponentName.css`

### 测试规范
- 单元测试使用 Vitest
- 组件测试使用 React Testing Library
- 测试文件: `*.test.js` / `*.test.jsx`

---

## 常见问题与解决方案

### 1. AI 不落子问题

**症状**: 人机对战时 AI 一直显示"思考中"但不落子

**常见原因**:
- React useEffect 闭包陷阱 - 使用旧的状态值
- handleCellClick 中的权限检查阻止 AI 落子

**解决方案**:
- AI 的 effect 直接更新状态，不调用 handleCellClick
- 使用 ref 标识 AI 落子 vs 用户落子

### 2. 在线对战连接失败

**症状**: WebSocket 连接错误

**排查步骤**:
1. 检查后端服务器是否运行 (`npm run server`)
2. 检查端口 3000 是否被占用
3. 检查防火墙设置

### 3. 部署后功能异常

**排查步骤**:
1. 检查 .env.production 环境变量
2. 确认 Supabase 配置正确
3. 查看 CloudBase 日志

---

## 部署指南

### 前端部署
```bash
npm run build
npx cloudbase hosting:deploy dist -e codebuddy-9gu42kpn62ead2e2
```

### 后端部署
```bash
cd cloudbase/server
tcb cloudrun deploy -s wuziqi-server --port 3000 --source . --force
```

---

## 相关文档

- [README.md](./README.md) - 完整项目文档
- [会话记录索引.md](./会话记录索引.md) - 开发会话记录
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) - 项目文档

---

## 维护者

- **开发者**: 狮王李
- **版本**: v1.2.7
- **更新日期**: 2026-03-07
