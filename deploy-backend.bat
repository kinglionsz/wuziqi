@echo off
chcp 65001 >nul
echo ==========================================
echo  五子棋后端部署脚本
echo ==========================================
echo.
cd /d D:\ampa_migra\G\CodeSources\ai_project\codebuddy_project\wuziqi\cloudbase\server
echo 正在部署到 CloudBase...
tcb cloudrun deploy -s wuziqi-server --port 3000 --source . --force
echo.
echo ==========================================
echo 部署完成！
echo ==========================================
pause
