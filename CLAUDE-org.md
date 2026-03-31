# CLAUDE.md - 五子棋项目 AI 助手指南

本文档供 Claude Code (claude.ai/code) 或其他 AI 编程助手使用。

---

## 项目快速开始

```bash
npm install
npm start          # 同时启动前端 + 后端
npm run dev        # 仅前端
npm run server     # 仅后端
npm test           # 测试
npm run build      # 生产构建
```

---

## 技术栈

- **前端**: React 19 + Vite 7 + TailwindCSS 4
- **后端**: Node.js + Express + Socket.io
- **数据库**: Supabase (PostgreSQL)
- **部署**: 腾讯云 CloudBase

---

## 文件管理习惯（重要！）

### 必须清理的文件

AI 在完成代码修改后，**必须**检查并清理以下文件：

| 文件模式 | 示例 | 处理 |
|----------|------|------|
| `*copy*` | `App copy.jsx` | **删除** |
| `*副本*` | `cloudbase - 副本/` | **删除** |
| `*_backup*` | `index_backup.js` | **删除** |
| `.ts` + `.tsx` 重复 | `App.jsx` + `App.tsx` | 保留一个 |
| `.js` + `.jsx` 重复 | `main.js` + `main.jsx` | 保留一个 |

### 自动清理触发时机

1. 完成代码修改后
2. 用户请求"整理"时
3. 发现备份文件时

### 清理命令

```bash
# 查找备份文件
Get-ChildItem -Recurse -Filter "*copy*" | Select-Object FullName
Get-ChildItem -Recurse -Filter "*副本*" | Select-Object FullName

# 删除备份文件
Get-ChildItem -Recurse -Filter "*copy*" | Remove-Item -Force
Get-ChildItem -Recurse -Filter "*副本*" | Remove-Item -Force
```

---

## 项目结构

```
wuziqi/
├── src/
│   ├── components/       # React 组件
│   │   ├── Board/       # 棋盘
│   │   └── Modals/      # 模态框
│   ├── hooks/           # React Hooks
│   │   ├── useGameLogic.js
│   │   └── useOnlineGame.js
│   ├── utils/           # 工具函数
│   │   ├── ai.js
│   │   ├── constants.js
│   │   └── sound.js
│   ├── lib/             # 第三方库
│   │   └── supabase.js
│   ├── App.jsx          # 主应用（仅一个）
│   └── main.jsx         # 入口（仅一个）
├── cloudbase/server/     # 后端
│   ├── index.js
│   ├── server.js
│   └── utils/
├── .gitignore           # 已配置忽略 .env 等
└── package.json
```

---

## 环境变量

开发环境需要 `.env` 文件（已加入 .gitignore）：

```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## 代码规范

- 组件命名: `PascalCase.jsx`
- Hooks 命名: `camelCase.js`
- 测试文件: `*.test.js`
- 样式文件: 与组件同名 `.css`

---

## 详细规范

请参考 `claude_docs/文件管理习惯.md` 获取完整的文件管理规则。
