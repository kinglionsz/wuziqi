@echo off
chcp 65001 >nul
echo ========================================
echo   五子棋云端部署脚本
echo ========================================
echo.

:: 1. 安装依赖
echo [1/5] 安装依赖...
call npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    exit /b 1
)
echo ✅ 依赖安装完成
echo.

:: 2. 构建前端
echo [2/5] 构建前端...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败
    exit /b 1
)
echo ✅ 构建完成
echo.

:: 3. 登录 CloudBase (如果未登录)
echo [3/5] 检查 CloudBase 登录状态...
tcb login --no-browser 2>nul
if errorlevel 1 (
    echo ⚠️  请手动执行：tcb login
    pause
)
echo ✅ CloudBase 已登录
echo.

:: 4. 部署前端到静态托管
echo [4/5] 部署前端到静态托管...
echo.
echo ⚠️  注意：请确保已在 CloudBase 控制台设置前端环境变量:
echo    VITE_SOCKET_URL = https://wuziqi-server-227261-9-1402693592.sh.run.tcloudbase.com
echo.
pause

:: 使用官方部署命令
tcb framework deploy -y
if errorlevel 1 (
    echo ❌ 部署失败，请检查网络连接和登录状态
    exit /b 1
)
echo ✅ 前端部署完成
echo.

:: 5. 部署后端云托管
echo [5/5] 部署后端云托管...
echo.
echo ⚠️  请确保已在 CloudBase 控制台设置后端环境变量:
echo    ALLOWED_ORIGIN = https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com
echo    TCB_ENV_ID = codebuddy-9gu42kpn62ead2e2
echo    NODE_ENV = production
echo.
echo 按任意键继续部署后端...
pause

:: 云托管部署命令
cd cloudbase\server
tcb cloudrun deploy -s wuziqi-server --port 3000 --force
cd ..\..

echo.
echo ========================================
echo   部署完成！
echo ========================================
echo.
echo 前端地址：https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com
echo 后端地址：https://wuziqi-server-227261-9-1402693592.sh.run.tcloudbase.com
echo.
pause
