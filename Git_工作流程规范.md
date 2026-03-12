# Git 工作流程规范

## 1. 标准提交流程

### 基础流程
```bash
# 1. 检查状态
git status

# 2. 添加修改的文件
git add <文件路径>
# 或添加所有修改
git add .

# 3. 提交
git commit -m "提交描述"
```

### 使用提交消息文件（避免参数解析问题）
```bash
# 创建提交消息文件
echo "fix: 修复问题描述" > .git_commit_msg.txt
echo "" >> .git_commit_msg.txt
echo "- 具体修改1" >> .git_commit_msg.txt
echo "- 具体修改2" >> .git_commit_msg.txt

# 提交
git commit -F .git_commit_msg.txt
```

## 2. SSH远程配置

### 查看当前远程地址
```bash
git remote -v
```

### 修改为SSH方式
```bash
git remote set-url origin git@github.com:kinglionsz/wuziqi.git
```

### 测试SSH连接
```bash
ssh -T git@github.com
# 期望输出: Hi kinglionsz! You've successfully authenticated, but GitHub does not provide shell access.
```

## 3. 推送流程

### 基础推送
```bash
git push origin <分支名>
```

### 推送脚本
使用脚本简化推送流程：

**Linux/Mac:**
```bash
./scripts/git_push_ssh.sh at_home
```

**Windows:**
```cmd
scripts\git_push_ssh.bat at_home
```

## 4. 常见问题解决

### 网络连接问题
如果HTTPS连接失败，切换到SSH：
```bash
# 修改远程地址为SSH
git remote set-url origin git@github.com:kinglionsz/wuziqi.git

# 验证配置
git config --get remote.origin.url

# 推送
git push origin at_home
```

### SSH密钥问题
1. 生成SSH密钥：
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. 添加公钥到GitHub：
   - 复制 `~/.ssh/id_ed25519.pub` 内容
   - 添加到 GitHub: Settings > SSH and GPG keys > New SSH key

### 提交消息格式规范
```
<类型>: <简短描述>

- 详细描述修改内容
- 修复的问题
- 影响范围
```

**类型示例**:
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具

## 5. 脚本文件

### git_push_ssh.sh (Linux/Mac)
```bash
#!/bin/bash
# Git SSH推送脚本
# 用法: ./git_push_ssh.sh <分支名>
```

### git_push_ssh.bat (Windows)
```batch
@echo off
REM Git SSH推送脚本
REM 用法: git_push_ssh.bat <分支名>
```

## 6. 最佳实践

1. **提交前检查**
   ```bash
   git status
   git diff --cached  # 查看暂存区的修改
   ```

2. **保持提交原子性**
   - 每个提交只做一件事
   - 提交描述清晰明确

3. **定期同步远程仓库**
   ```bash
   git fetch origin
   git rebase origin/<分支名>
   ```

4. **解决冲突**
   ```bash
   # 拉取最新代码
   git pull origin <分支名>
   
   # 解决冲突后
   git add .
   git rebase --continue
   ```

## 7. 项目特定配置

### 当前项目配置
- **仓库URL**: `git@github.com:kinglionsz/wuziqi.git`
- **主要分支**: `at_home`
- **工作目录**: `D:\ampa_migra\G\CodeSources\ai_project\codebuddy_project\wuziqi`

### 常用命令
```bash
# 进入项目目录
cd D:\ampa_migra\G\CodeSources\ai_project\codebuddy_project\wuziqi

# 完整推送流程
git status
git add .
git commit -m "fix: 修复描述"
git push origin at_home
```

---
**文档版本**: 1.0  
**最后更新**: 2026年3月12日  
**维护者**: AI助手