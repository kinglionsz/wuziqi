@echo off
chcp 65001 >nul
echo ========================================
echo   部署文档到 CloudBase
echo ========================================
echo.

echo [1/3] 构建前端...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败
    exit /b 1
)
echo ✅ 构建完成
echo.

echo [2/3] 检查 docs.html...
if not exist public\docs.html (
    echo ❌ public\docs.html 不存在
    exit /b 1
)
echo ✅ docs.html 存在
echo.

echo [3/3] 部署到 CloudBase...
tcb hosting:deploy dist -e codebuddy-9gu42kpn62ead2e2
if errorlevel 1 (
    echo ❌ 部署失败
    exit /b 1
)
echo ✅ 部署完成
echo.

echo ========================================
echo   部署成功！
echo ========================================
echo.
echo 文档地址：https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com/docs.html
echo.
pause
