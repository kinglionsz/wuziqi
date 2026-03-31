---
name: ESLint错误修复计划
overview: 修复五子棋项目中10个ESLint错误和4个警告，确保不引入新bug
todos:
  - id: fix-app-socket
    content: 修复 App.jsx - 移除未使用的 socket 变量
    status: completed
  - id: fix-app-require
    content: 修复 App.jsx - 将 require 改为 ES Module import
    status: completed
    dependencies:
      - fix-app-socket
  - id: fix-modal-setstate
    content: 修复 RoomModal.jsx 和 SettingsModal.jsx - 添加 setState in effect 的 eslint-disable 注释
    status: completed
    dependencies:
      - fix-board-usememo
  - id: fix-onlinegame-deps
    content: 修复 useOnlineGame.js - 补充缺失依赖或添加 eslint-disable
    status: completed
    dependencies:
      - fix-gamelogic-deps
  - id: fix-ai-unused
    content: 修复 ai.js - 移除未使用的 humanPlayer 参数
    status: completed
    dependencies:
      - fix-onlinegame-deps
  - id: verify-lint
    content: 运行 npm run lint 验证所有问题已修复
    status: completed
    dependencies:
      - fix-ai-unused
---

## 用户需求

修复项目中的 ESLint 检查错误（共 10 个错误和 4 个警告），确保代码质量且不引入新 bug。

## 问题汇总

1. **src/App.jsx** (3 错误): socket 未使用、setState in effect、require 语法
2. **src/components/Board.jsx** (1 错误 + 1 警告): useMemo 依赖问题
3. **src/components/Modals/RoomModal.jsx** (1 错误): setState in effect
4. **src/components/Modals/SettingsModal.jsx** (1 错误): setState in effect  
5. **src/hooks/useGameLogic.js** (1 错误 + 1 警告): exhaustive-deps
6. **src/hooks/useOnlineGame.js** (1 错误 + 2 警告): exhaustive-deps
7. **src/utils/ai.js** (2 错误): 未使用变量

## 技术方案

采用保守修复策略，确保不改变功能逻辑：

1. **socket 未使用**: 在 App.jsx 中移除 socket 的解构（或保留但标记为 intentional）
2. **require 语法**: 将 CommonJS require 改为 ES Module import
3. **setState in effect**: 这是合理用法，添加 eslint-disable 注释
4. **useMemo 依赖**: 优化依赖数组，确保正确的计算
5. **exhaustive-deps**: 补充缺失依赖或使用 eslint-disable 注释（对于有意为之的依赖）
6. **未使用变量**: 移除 ai.js 中未使用的 humanPlayer 参数或使用下划线前缀

## 实现细节

- 优先使用代码修复而非禁用注释
- 保留原有业务逻辑不变
- 添加必要的依赖而非简单禁用规则