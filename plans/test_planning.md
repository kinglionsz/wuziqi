# 五子棋项目测试功能规划方案

## 一、项目测试需求分析

### 1.1 项目技术栈

| 层级 | 技术栈 | 测试需求 |
|------|--------|----------|
| 前端 | React 19 + Vite + TypeScript | 组件测试、Hook 测试 |
| 核心逻辑 | 纯 JavaScript 函数 | 单元测试 |
| 后端 | Node.js + Express + Socket.IO | 单元测试、API 测试 |
| 构建工具 | Vite | 集成测试 |

### 1.2 核心测试模块

```
┌─────────────────────────────────────────────────────────┐
│                      测试覆盖范围                         │
├─────────────────────┬───────────────────────────────────┤
│ 模块                │ 测试内容                           │
├─────────────────────┼───────────────────────────────────┤
│ src/utils/ai.js     │ AI算法、位置评估、胜负判定         │
│ cloudbase/server/   │ 后端游戏逻辑、房间管理、Socket通信  │
│   utils/gameLogic.js│                                    │
├─────────────────────┼───────────────────────────────────┤
│ src/hooks/          │ 游戏状态管理、在线对战逻辑          │
│   useGameLogic.js   │                                    │
│   useOnlineGame.js  │                                    │
├─────────────────────┼───────────────────────────────────┤
│ src/components/     │ 棋盘渲染、交互、模态框             │
│   Board.jsx         │                                    │
└─────────────────────┴───────────────────────────────────┘
```

---

## 二、测试框架选型

### 2.1 推荐方案

| 用途 | 框架 | 版本 | 理由 |
|------|------|------|------|
| 单元测试 | Vitest | ^3.0.0 | 与 Vite 深度集成、速度快、API 与 Jest 兼容 |
| 组件测试 | React Testing Library | ^14.0.0 | React 官方推荐、关注用户行为 |
| E2E 测试 | Playwright | ^1.40.0 | 现代浏览器支持、多平台 |
| Mock | Vitest built-in + MSW | ^2.0.0 | API Mock |

### 2.2 依赖安装

```bash
# 单元测试 + 组件测试
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom

# E2E 测试
npm install -D @playwright/test

# Mock 服务
npm install -D msw@^2.0.0
```

---

## 三、测试目录结构

```
wuziqi/
├── src/
│   ├── utils/
│   │   ├── ai.js
│   │   └── __tests__/           # 新增
│   │       ├── ai.test.js
│   │       └── constants.js
│   ├── hooks/
│   │   ├── useGameLogic.js
│   │   ├── useOnlineGame.js
│   │   └── __tests__/           # 新增
│   │       ├── useGameLogic.test.js
│   │       └── useOnlineGame.test.js
│   ├── components/
│   │   ├── Board.jsx
│   │   └── __tests__/           # 新增
│   │       └── Board.test.jsx
│   └── __mocks__/               # 新增 (全局 Mock)
│       ├── fileMock.js
│       └── styleMock.js
├── cloudbase/server/
│   ├── utils/
│   │   ├── gameLogic.js
│   │   └── __tests__/           # 新增
│   │       └── gameLogic.test.js
│   └── index.js
├── tests/                       # E2E 测试
│   ├── fixtures/
│   │   └── boards/
│   │       ├── win-horizontal.json
│   │       ├── win-vertical.json
│   │       ├── win-diagonal.json
│   │       └── draw.json
│   └── e2e/
│       └── game.spec.js
├── vitest.config.js             # 新增
├── playwright.config.js         # 新增
└── package.json
```

---

## 四、测试用例规划

### 4.1 核心逻辑单元测试 (AI & 游戏规则)

#### 4.1.1 胜负判定测试 `checkWinner`

| 场景 | 测试用例 | 预期结果 |
|------|----------|----------|
| 水平连五 | 5子横向连续 | true |
| 垂直连五 | 5子纵向连续 | true |
| 对角线连五(\) | 5子对角线连续 | true |
| 对角线连五(/) | 5子反斜线连续 | true |
| 四连 | 仅4子连续 | false |
| 边界五连 | 边界处的五连 | true |
| 无连 | 分散棋子 | false |

**测试数据 fixtures:**

```json
// tests/fixtures/boards/win-horizontal.json
{
  "board": [
    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    ["black", "black", "black", "black", "black", null, null, null, null, null, null, null, null, null, null],
    ...
  ],
  "lastMove": { "row": 2, "col": 2, "player": "black" },
  "expected": true
}
```

#### 4.1.2 位置评估测试 `evaluatePosition`

| 场景 | 测试用例 | 预期结果 |
|------|----------|----------|
| 成五 | 五连 | score >= 100000 |
| 活四 | 两端开放的四连 | score >= 10000 |
| 冲四 | 一端封闭的四连 | score >= 1000 |
| 活三 | 两端开放的三连 | score >= 1000 |
| 眠三 | 一端封闭的三连 | score >= 100 |
| 活二 | 两端开放的二连 | score >= 100 |

#### 4.1.3 候选落子位置 `getCandidateMoves`

| 场景 | 测试用例 | 预期结果 |
|------|----------|----------|
| 空棋盘 | 15x15全空 | 返回中心位置 [{row:7,col:7}] |
| 有棋子 | 已有落子 | 返回棋子周围2格内的空位 |
| 边界情况 | 边缘落子 | 不产生越界位置 |

#### 4.1.4 后端游戏逻辑

| 函数 | 测试用例 |
|------|----------|
| `createEmptyBoard()` | 15x15全null数组 |
| `validateMove()` | 越界、已有棋子、合法落子 |
| `checkDraw()` | 棋盘满、空棋盘 |
| `generateRoomId()` | 长度、字符集、唯一性 |
| `createRoom()` | 房间对象结构 |

### 4.2 Hook 测试

#### 4.2.1 useGameLogic

| 场景 | 测试内容 |
|------|----------|
| 初始化 | 默认状态验证 |
| 落子 | 状态更新、棋盘变化 |
| 胜负判定 | 胜利时状态转换 |
| 悔棋 | 历史记录回退 |
| 重新开始 | 状态重置 |

#### 4.2.2 useOnlineGame

| 场景 | 测试内容 |
|------|----------|
| 连接 | Socket 连接建立 |
| 加入房间 | 房间状态同步 |
| 落子同步 | 对方落子接收 |
| 断线重连 | 状态恢复 |

### 4.3 组件测试

#### 4.3.1 Board 组件

```javascript
// 核心测试场景
test('点击空位应落子', () => {
  render(<Board />)
  fireEvent.click(screen.getByTestId('cell-7-7'))
  expect(screen.getByTestId('cell-7-7')).toHaveClass('black')
})

test('已有棋子不可点击', () => {
  // ... 设置已有棋子
  fireEvent.click(screen.getByTestId('cell-7-7'))
  // 验证不重复落子
})

test('胜利时应显示胜利模态', () => {
  // ... 设置五连
  expect(screen.getByText('获胜')).toBeInTheDocument()
})
```

---

## 五、测试配置

### 5.1 Vitest 配置 `vitest.config.js`

```javascript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__mocks__/setupTests.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}', 'cloudbase/server/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/utils/**/*.js', 'cloudbase/server/utils/**/*.js']
    }
  }
})
```

### 5.2 package.json 脚本

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:run && npm run test:e2e"
  }
}
```

---

## 六、执行计划

### 阶段一：基础建设 (优先级：高)
1. 安装测试依赖
2. 创建测试配置文件
3. 设置全局 Mock
4. 编写 `checkWinner` 核心测试 (10个用例)

### 阶段二：单元测试 (优先级：高)
1. AI 算法测试 (15个用例)
2. Hook 测试 (10个用例)
3. 后端逻辑测试 (10个用例)

### 阶段三：集成测试 (优先级：中)
1. Board 组件测试 (8个用例)
2. 关键用户流程测试

### 阶段四：CI/CD 集成 (优先级：低)
1. GitHub Actions 配置
2. 测试覆盖率阈值

---

## 七、测试覆盖率目标

| 类型 | 目标覆盖率 |
|------|------------|
| 核心逻辑 (ai.js, gameLogic.js) | ≥ 90% |
| Hooks | ≥ 80% |
| 组件 | ≥ 70% |
| 整体 | ≥ 75% |

---

## 八、注意事项

1. **随机性处理**: AI 的 `findEasyMove` / `findMediumMove` 包含随机逻辑，测试时需要 mock `Math.random`
2. **Socket 测试**: 在线对战逻辑需要 mock Socket.IO
3. **浏览器 API**: 部分测试需要 jsdom 环境
4. **边界条件**: 15x15 棋盘的边界情况需要特别关注

---

您对这个规划是否满意？如需调整请告诉我：
- 是否需要添加 E2E 测试？
- 测试覆盖率目标是否合适？
- 优先实现哪些测试用例？
