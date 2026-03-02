# 五子棋游戏测试功能列表

## 概述

本文档详细列出了五子棋项目（xiaochidian）中所有的测试功能、测试用例及其覆盖范围。

**测试框架**: Vitest
**测试环境**: jsdom
**配置文件**: `vitest.config.js`

---

## 测试文件结构

```
wuziqi/
├── src/
│   ├── __tests__/
│   │   └── setup.js                    # 测试环境配置
│   └── utils/
│       └── __tests__/
│           ├── ai.test.js              # AI逻辑测试
│           └── simple.test.js          # 简单测试验证
├── tests/
│   └── utils/
│       └── testHelpers.js              # 共享测试辅助函数
└── cloudbase/
    └── server/
        └── utils/
            └── __tests__/
                └── gameLogic.test.js   # 游戏逻辑测试
```

---

## 测试环境配置 (setup.js)

**文件位置**: `src/__tests__/setup.js`

### 配置的 Mock 对象

| Mock 对象 | 用途 |
|-----------|------|
| `window.matchMedia` | 模拟媒体查询功能 |
| `ResizeObserver` | 模拟元素尺寸观察器 |
| `Element.prototype.scrollIntoView` | 模拟滚动行为 |
| `localStorage` | 模拟本地存储 |
| `sessionStorage` | 模拟会话存储 |

---

## 共享测试辅助函数 (testHelpers.js)

**文件位置**: `tests/utils/testHelpers.js`

### 提供的辅助函数

| 函数名 | 功能描述 | 导出状态 |
|--------|----------|----------|
| `BOARD_SIZE` | 棋盘常量（15x15） | ✅ |
| `DIRECTIONS` | 四个方向数组（水平、垂直、对角线、反对角线） | ✅ |
| `createEmptyBoard()` | 创建15x15空棋盘 | ✅ |
| `createBoard(pieces)` | 根据棋子列表创建棋盘 | ✅ |
| `checkWinner(board, row, col, player)` | 检查是否有五子连珠 | ✅ |
| `checkDraw(board)` | 检查是否平局 | ✅ |
| `validateMove(row, col, board)` | 验证落子合法性 | ✅ |
| `generateRoomId(length)` | 生成房间ID | ✅ |

---

## 测试文件详细列表

### 1. 游戏逻辑测试 (gameLogic.test.js)

**文件位置**: `cloudbase/server/utils/__tests__/gameLogic.test.js`

#### 测试套件 1: `checkWinner` - 获胜判定

| 用例ID | 测试用例描述 | 输入参数 | 预期结果 | 状态 |
|--------|-------------|----------|----------|------|
| GL-001 | 空棋盘应返回无获胜 | 空棋盘, (7,7), 'black' | `false` | ✅ |
| GL-002 | 水平五子连珠应返回获胜 | 水平5黑子, (7,2), 'black' | `true` | ✅ |
| GL-003 | 垂直五子连珠应返回获胜 | 垂直5黑子, (5,7), 'black' | `true` | ✅ |
| GL-004 | 对角线(\)五子连珠应返回获胜 | 对角线5黑子, (2,2), 'black' | `true` | ✅ |
| GL-005 | 四子连珠应返回无获胜 | 水平4黑子, (7,1), 'black' | `false` | ✅ |

#### 测试套件 2: `checkDraw` - 平局判定

| 用例ID | 测试用例描述 | 输入参数 | 预期结果 | 状态 |
|--------|-------------|----------|----------|------|
| GL-006 | 空棋盘应返回非平局 | 空棋盘 | `false` | ✅ |
| GL-007 | 部分棋盘应返回非平局 | 部分填充棋盘 | `false` | ✅ |
| GL-008 | 满棋盘应返回平局 | 15x15满棋盘 | `true` | ✅ |

#### 测试套件 3: `createEmptyBoard` - 创建空棋盘

| 用例ID | 测试用例描述 | 预期结果 | 状态 |
|--------|-------------|----------|------|
| GL-009 | 应创建15x15棋盘 | 棋盘尺寸为15x15 | ✅ |
| GL-010 | 所有单元格应为null | 所有位置值为null | ✅ |

#### 测试套件 4: `validateMove` - 落子验证

| 用例ID | 测试用例描述 | 输入参数 | 预期结果 | 状态 |
|--------|-------------|----------|----------|------|
| GL-011 | 合法落子应返回验证通过 | (0,0), 空位棋盘 | `{valid: true, error: null}` | ✅ |
| GL-012 | 行越界应返回错误 | (15,7), 任意棋盘 | `{valid: false, error: '位置越界'}` | ✅ |
| GL-013 | 列越界应返回错误 | (7,15), 任意棋盘 | `{valid: false, error: '位置越界'}` | ✅ |
| GL-014 | 已占用位置应返回错误 | (7,7), 有子棋盘 | `{valid: false, error: '该位置已有棋子'}` | ✅ |

#### 测试套件 5: `generateRoomId` - 生成房间ID

| 用例ID | 测试用例描述 | 输入参数 | 预期结果 | 状态 |
|--------|-------------|----------|----------|------|
| GL-015 | 默认长度应为6位 | 无参数 | 长度为6 | ✅ |
| GL-016 | 自定义长度应生效 | 长度4 | 长度为4 | ✅ |
| GL-017 | 应只包含有效字符 | 长度100 | 仅包含字母数字（不含易混淆字符） | ✅ |

#### 测试套件 6: `BOARD_SIZE` - 棋盘常量

| 用例ID | 测试用例描述 | 预期结果 | 状态 |
|--------|-------------|----------|------|
| GL-018 | 棋盘尺寸应为15 | `BOARD_SIZE` 值为15 | ✅ |

---

### 2. AI逻辑测试 (ai.test.js)

**文件位置**: `src/utils/__tests__/ai.test.js`

#### 测试套件 1: `AI checkWinner` - AI获胜判定

| 用例ID | 测试用例描述 | 输入参数 | 预期结果 | 状态 |
|--------|-------------|----------|----------|------|
| AI-001 | 空棋盘应返回无获胜 | 空棋盘, (7,7), 'black' | `false` | ✅ |
| AI-002 | 水平五子连珠应返回获胜 | 水平5黑子, (7,2), 'black' | `true` | ✅ |
| AI-003 | 垂直五子连珠应返回获胜 | 垂直5黑子, (5,7), 'black' | `true` | ✅ |
| AI-004 | 对角线(\)五子连珠应返回获胜 | 对角线(\)5黑子, (2,2), 'black' | `true` | ✅ |
| AI-005 | 对角线(/)五子连珠应返回获胜 | 对角线(/)5白子, (2,8), 'white' | `true` | ✅ |
| AI-006 | 四子连珠应返回无获胜 | 水平4黑子, (7,1), 'black' | `false` | ✅ |

#### 测试套件 2: `checkDraw` - AI平局判定

| 用例ID | 测试用例描述 | 输入参数 | 预期结果 | 状态 |
|--------|-------------|----------|----------|------|
| AI-007 | 空棋盘应返回非平局 | 空棋盘 | `false` | ✅ |
| AI-008 | 部分棋盘应返回非平局 | 部分填充棋盘 | `false` | ✅ |
| AI-009 | 满棋盘应返回平局 | 15x15满棋盘 | `true` | ✅ |

#### 测试套件 3: `Board operations` - 棋盘操作

| 用例ID | 测试用例描述 | 预期结果 | 状态 |
|--------|-------------|----------|------|
| AI-010 | 应创建空15x15棋盘 | 棋盘尺寸为15x15 | ✅ |
| AI-011 | 所有单元格初始化应为null | 所有位置值为null | ✅ |
| AI-012 | 应能正确落子 | 落子后位置值为'black' | ✅ |

---

### 3. 简单测试 (simple.test.js)

**文件位置**: `src/utils/__tests__/simple.test.js`

#### 测试套件 1: `simple test` - 基础验证

| 用例ID | 测试用例描述 | 预期结果 | 状态 |
|--------|-------------|----------|------|
| ST-001 | 基础算术运算测试 | `1 + 1 = 2` | ✅ |

> **说明**: 此测试用例用于验证 Vitest 测试框架是否正常工作。

---

## 测试统计

### 按模块统计

| 模块 | 测试文件数 | 测试套件数 | 测试用例数 |
|------|-----------|-----------|-----------|
| 游戏逻辑 (gameLogic) | 1 | 6 | 18 |
| AI逻辑 (ai) | 1 | 3 | 12 |
| 简单测试 (simple) | 1 | 1 | 1 |
| **总计** | **3** | **10** | **31** |

### 按功能分类统计

| 功能类别 | 测试用例数 | 覆盖率 |
|---------|-----------|--------|
| 获胜判定 | 11 | ✅ |
| 平局判定 | 6 | ✅ |
| 棋盘创建 | 4 | ✅ |
| 落子验证 | 4 | ✅ |
| 房间ID生成 | 3 | ✅ |
| 棋盘操作 | 3 | ✅ |

### 按测试类型统计

| 测试类型 | 测试用例数 |
|---------|-----------|
| 单元测试 | 31 |
| 集成测试 | 0 |
| E2E测试 | 0 |

---

## 测试覆盖的功能模块

### ✅ 已覆盖

1. **核心游戏逻辑**
   - 获胜判定（水平、垂直、对角线、反对角线）
   - 平局判定
   - 棋盘初始化
   - 落子合法性验证

2. **在线对战功能**
   - 房间ID生成

3. **AI功能**
   - AI获胜判定逻辑
   - AI平局判定逻辑
   - AI棋盘操作

### ❌ 未覆盖

1. **UI组件测试**
   - Board组件
   - Modals组件（VictoryModal, RulesModal, SettingsModal, ReplayModal, RoomModal）
   - 按钮交互
   - 主题切换

2. **Hooks测试**
   - useGameLogic
   - useOnlineGame

3. **AI算法测试**
   - 简单难度AI
   - 中等难度AI
   - 困难难度AI（Minimax + Alpha-Beta剪枝）

4. **网络通信测试**
   - WebSocket连接
   - 房间创建/加入
   - 实时落子同步

5. **数据存储测试**
   - 本地存储
   - 云端存储（Supabase）

6. **音效系统测试**
   - 落子音效
   - 胜利音效

7. **计时器功能测试**
   - 游戏总时间
   - 黑方累计时间
   - 白方累计时间

---

## 运行测试

### 运行所有测试

```bash
npm test
```

### 运行特定测试文件

```bash
# 游戏逻辑测试
npm test -- cloudbase/server/utils/__tests__/gameLogic.test.js

# AI逻辑测试
npm test -- src/utils/__tests__/ai.test.js

# 简单测试
npm test -- src/utils/__tests__/simple.test.js
```

### 监听模式

```bash
npm test -- --watch
```

### 生成覆盖率报告

```bash
npm test -- --coverage
```

---

## 测试配置说明

**vitest.config.js** 关键配置:

```javascript
{
  test: {
    globals: true,              // 使用全局 describe/it/expect
    environment: 'jsdom',       // 使用 jsdom 环境
    setupFiles: ['./src/__tests__/setup.js'],  // 测试环境配置文件
    include: [
      'src/**/*.test.{js,jsx,ts,tsx}',
      'cloudbase/server/**/*.test.js'
    ],
    pool: 'forks',              // 使用 forks 池
    testTimeout: 30000          // 测试超时时间30秒
  }
}
```

---

## 测试最佳实践建议

### 1. 增加UI组件测试

使用 `@testing-library/react` 测试React组件：

```javascript
import { render, screen } from '@testing-library/react'
import Board from '../Board'

test('Board renders correctly', () => {
  render(<Board />)
  expect(screen.getByRole('grid')).toBeInTheDocument()
})
```

### 2. 增加Hooks测试

使用 `@testing-library/react-hooks` 测试自定义Hooks：

```javascript
import { renderHook, act } from '@testing-library/react'
import useGameLogic from '../hooks/useGameLogic'

test('useGameLogic initial state', () => {
  const { result } = renderHook(() => useGameLogic())
  expect(result.current.board).toHaveLength(15)
})
```

### 3. 增加AI算法测试

测试不同难度级别的AI：

```javascript
test('easy AI should make random move', () => {
  const move = getAIMove(board, 'black', 'easy')
  expect(move).toBeDefined()
})

test('hard AI should use minimax', () => {
  const move = getAIMove(board, 'black', 'hard')
  expect(move).toBeOptimal()
})
```

### 4. 增加集成测试

测试完整游戏流程：

```javascript
test('complete game flow', async () => {
  // 创建房间
  // 玩家加入
  // 落子
  // 判定胜负
})
```

---

## 维护说明

- **最后更新时间**: 2026-03-02
- **测试框架版本**: Vitest
- **维护者**: 开发团队

如有新增测试功能，请及时更新本文档。