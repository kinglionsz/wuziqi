@echo off
REM Git SSH推送脚本 (Windows版本)
REM 用于解决HTTPS连接问题，强制使用SSH推送

echo === Git SSH推送脚本 ===
echo 当前目录: %CD%
echo 分支: %1
echo.

REM 检查参数
if "%1"=="" (
    echo 使用方法: %0 ^<分支名^>
    echo 例如: %0 at_home
    exit /b 1
)

set BRANCH=%1

REM 显示当前远程配置
echo 1. 检查当前远程地址...
git remote -v
echo.

REM 修改为SSH方式
echo 2. 设置SSH远程地址...
git remote set-url origin git@github.com:kinglionsz/wuziqi.git
echo SSH地址已设置
echo.

REM 测试SSH连接
echo 3. 测试SSH连接到GitHub...
ssh -T git@github.com
echo.

REM 推送
echo 4. 推送到远程仓库分支: %BRANCH%...
echo 执行: git push origin %BRANCH%
echo.
git push origin %BRANCH%

REM 显示结果
echo.
echo === 推送完成 ===
echo 提示: 如果仍然失败，请检查网络连接或SSH密钥配置