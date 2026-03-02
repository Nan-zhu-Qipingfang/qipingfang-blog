@echo off
chcp 65001 >nul
echo ========================================
echo   七平方の Blog - 推送到 GitHub
echo ========================================
echo.
echo 正在推送到 GitHub...
echo 仓库：https://github.com/Nan-zhu-Qipingfang/qipingfang-blog
echo.
echo 如果提示输入密码，请使用 GitHub Token：
echo https://github.com/settings/tokens
echo.
echo ========================================
echo.

cd /d "%~dp0"
git push -u origin main

echo.
echo ========================================
echo.
if %ERRORLEVEL% EQU 0 (
    echo 推送成功！
    echo.
    echo 接下来请访问：
    echo https://vercel.com/new
    echo.
    echo 导入你的仓库完成部署。
) else (
    echo 推送失败，请检查网络连接或 GitHub Token。
    echo.
    echo 可尝试：
    echo 1. 使用代理
    echo 2. 检查 Token 权限
)
echo ========================================
echo.
pause
