@echo off
chcp 65001 >nul
echo ==========================================
echo  五子棋完整部署脚本（前端 + 后端）
echo ==========================================
echo.

REM 构建前端
echo [1/3] 正在构建前端...
cd /d D:\ampa_migra\G\CodeSources\ai_project\codebuddy_project\wuziqi
call npm run build
if errorlevel 1 (
    echo 前端构建失败！
    pause
    exit /b 1
)
echo 前端构建完成！
echo.

REM 部署后端
echo [2/3] 正在部署后端...
cd /d D:\ampa_migra\G\CodeSources\ai_project\codebuddy_project\wuziqi\cloudbase\server
echo n | tcb cloudrun deploy -s wuziqi-server --port 3000 --source .
if errorlevel 1 (
    echo 后端部署失败！
    pause
    exit /b 1
)
echo 后端部署完成！
echo.

REM 部署前端
echo [3/3] 正在部署前端...
cd /d D:\ampa_migra\G\CodeSources\ai_project\codebuddy_project\wuziqi
tcb hosting deploy dist -e codebuddy-9gu42kpn62ead2e2
echo 前端部署完成！
echo.

echo ==========================================
echo  全部部署完成！
echo ==========================================
echo 前端访问: https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com/
echo ==========================================
pause
