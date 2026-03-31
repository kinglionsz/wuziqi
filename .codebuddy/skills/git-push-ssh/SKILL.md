---
name: git-push-ssh
description: This skill should be used when pushing code to GitHub. It ensures the remote URL is set to SSH format before pushing to avoid HTTPS timeout issues.
---

# Git SSH 推送 Skill

## 使用场景

当需要推送代码到 GitHub 时使用本 Skill，确保使用 SSH 方式避免超时。

## 环境要求

**必须使用 PowerShell 执行命令**，不要使用 Command Prompt。

## 标准推送流程

每次推送前在 PowerShell 中执行以下命令：

```powershell
# 1. 查看当前远程地址
git remote -v

# 2. 修改为 SSH 方式（如需要）
git remote set-url origin git@github.com:kinglionsz/wuziqi.git

# 3. 推送代码
git push origin at_home
```

## 注意事项

1. 确保本地已配置 SSH 密钥 (`~/.ssh/id_rsa`)
2. 确保 GitHub 已添加公钥
3. 如推送超时，检查 SSH 代理是否运行：
   ```powershell
   Get-Service ssh-agent | Start-Service
   ssh-add ~\.ssh\id_rsa
   ```
4. **必须使用 PowerShell**，Command Prompt 可能有环境配置问题

