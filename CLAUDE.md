# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 快速开始

```bash
npm install                    # 安装依赖
npm start                      # 同时启动前端和后端服务器
npm run dev                    # 只启动前端开发服务器
npm run server                 # 只启动后端服务器
npm test                       # 运行测试
npm run build                  # 生产构建
```

## 技术栈

- **前端**: React 19 + Vite 7 + TailwindCSS 4
- **后端**: Node.js + Express + Socket.io
- **数据库**: Supabase (PostgreSQL)
- **部署**: 腾讯云 CloudBase (静态托管 + 云托管)

## 项目结构

```
wuziqi/
├── src/
│   ├── components/
│   │   ├── Board/              # 棋盘组件 (Board.jsx, Board.css)
│   │   └── Modals/             # 模态框组件 (Victory, Rules, Settings, Replay, Room)
│   ├── hooks/
│   │   ├── useGameLogic.js     # 本地游戏逻辑 Hook
│   │   └── useOnlineGame.js    # 在线对战 Hook
│   ├── lib/
│   │   └── supabase.js         # Supabase 客户端和数据库操作
│   ├── utils/
│   │   ├── constants.js        # 常量配置 (THEMES, GAME_MODES, AI_LEVELS)
│   │   ├── ai.js               # AI 算法 (Minimax + Alpha-Beta 剪枝)
│   │   └── sound.js            # 音效工具
│   ├── App.jsx                 # 主应用组件
│   └── main.jsx                # 入口文件
├── cloudbase/server/
│   ├── index.js                # 后端服务器入口 (WebSocket)
│   ├── server.js               # 服务器主逻辑
│   └── utils/
│       ├── gameLogic.js        # 游戏验证逻辑 (胜负判定、走棋验证)
│       └── database.js         # 数据库操作 (内存存储/CloudBase 数据库)
├── vitest.config.js            # Vitest 测试配置
└── vite.config.js              # Vite 配置 (含路径别名 @/@utils/@hooks)
```

## 核心模块

### 游戏逻辑 (`src/hooks/useGameLogic.js`)
管理本地游戏状态，包括：
- 棋盘状态管理
- 落子验证和胜负判定
- AI 落子逻辑 (PVE 模式)
- 计时器和游戏时间追踪
- 悔棋和回放功能

### 在线对战 (`src/hooks/useOnlineGame.js`)
处理在线对战逻辑：
- 创建/加入房间
- WebSocket 通信
- 断线重连处理
- 同步游戏状态

### 后端服务器 (`cloudbase/server/index.js`)
WebSocket 服务器：
- 房间管理 (create_room, join_room, leave_room)
- 落子同步 (place_piece)
- 断线重连缓冲区 (60 秒)
- 计时器管理

## 游戏模式

| 模式 | 说明 |
|------|------|
| PVP | 本地双人对战 |
| PVE | 人机对战 (简单/中等/困难) |
| ONLINE | 在线对战 (WebSocket) |

## AI 难度

| 难度 | 算法 |
|------|------|
| 简单 | 随机落子 + 基础进攻 |
| 中等 | 攻防平衡，偶尔失误 |
| 困难 | Minimax + Alpha-Beta 剪枝 |

## 环境变量

开发环境需要 `.env` 文件：
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## 测试

```bash
npm test                    # 运行所有测试
npm run test:ui             # 带 UI 的测试
npm run test:coverage       # 生成覆盖率报告
```

测试文件位于 `src/__tests__/` 和 `src/**/__tests__/`

## 部署

### CloudBase 部署
```bash
# 前端
npx cloudbase hosting:deploy dist -e <env-id>

# 后端 (云托管)
cd cloudbase/server
tcb cloudrun deploy -s wuziqi-server --port 3000 --source . --force
```

## 代码风格

- ESLint 9 配置
- Prettier 配置 (使用 `.prettierrc`)
- 组件按功能模块组织
- Hooks 封装可复用逻辑

## 📚 项目知识库

详细开发记录和历史对话保存在 Obsidian 知识库：
- **路径**: `D:\ObsidianVault\五子棋游戏\`
- **索引**: `D:\ObsidianVault\五子棋游戏\索引.md`

包含内容：
- 开发规范和文件管理习惯
- 完整的对话记录和代码审核
- 版本功能和更新日志

## ⚡ 知识库调用规则

**重要**：回答项目相关问题时，优先从本地知识库获取信息：

1. **优先读取** `D:\ampa_migra\G\CodeSources\ai_project\codebuddy_project\wuziqi\claude_docs\`
2. **其次读取** `D:\ObsidianVault\五子棋游戏\` (Obsidian 知识库)
3. 只有本地知识库没有合适答案时才调用模型获取

知识库包含：
- 开发命令和快速启动流程
- 部署命令和配置
- 完整的对话记录和代码审核
- 版本功能和更新日志
