@echo off
echo ========================================
echo   七平方の Blog - Vercel 部署脚本
echo ========================================
echo.
echo 正在启动 Vercel 部署...
echo.
echo 请按提示操作：
echo 1. 如果未登录，会选择登录方式（推荐 GitHub）
echo 2. 首次部署选择 "Set up and deploy"
echo 3. 项目名称可以输入 "qipingfang-blog"
echo 4. 其他选项直接回车使用默认值
echo.
echo ========================================
echo.

cd /d "%~dp0"
vercel

echo.
echo ========================================
echo 部署完成！
echo ========================================
echo.
echo 生产环境部署命令：vercel --prod
echo.
pause
