#!/bin/bash
# Git SSH推送脚本
# 用于解决HTTPS连接问题，强制使用SSH推送

echo "=== Git SSH推送脚本 ==="
echo "当前目录: $(pwd)"
echo "分支: $1"
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo "使用方法: $0 <分支名>"
    echo "例如: $0 at_home"
    exit 1
fi

BRANCH="$1"

# 显示当前远程配置
echo "1. 检查当前远程地址..."
git remote -v
echo ""

# 修改为SSH方式（如果需要）
echo "2. 设置SSH远程地址..."
git remote set-url origin git@github.com:kinglionsz/wuziqi.git
echo "SSH地址已设置"
echo ""

# 验证SSH连接
echo "3. 测试SSH连接到GitHub..."
ssh -T git@github.com
echo ""

# 推送
echo "4. 推送到远程仓库分支: $BRANCH..."
echo "执行: git push origin $BRANCH"
echo ""
git push origin $BRANCH

# 显示结果
echo ""
echo "=== 推送完成 ==="
echo "提示: 如果仍然失败，请检查网络连接或SSH密钥配置"