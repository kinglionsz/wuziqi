#!/bin/bash
# 部署脚本：准备前端静态文件并推送到 Railway

echo "🚀 开始准备五子棋前端部署到 Railway..."

# 1. 复制前端构建产物
echo "📦 复制前端构建产物..."
cd "$(dirname "$0")"
if [ -d "../railway-frontend/dist" ]; then
    cp -r ../railway-frontend/dist .
    echo "✅ 前端构建产物已复制"
else
    echo "❌ 错误：找不到 ../railway-frontend/dist 目录"
    exit 1
fi

# 2. 提交并推送到 Railway
echo "📤 推送代码到 Railway..."
railway up

echo "✅ 部署完成！"
