@echo off
chcp 65001 >nul
title DSH 开屏动画 一键安装 - 抖音@孤影 / 跃数AI中转站 ys666.site
echo.
echo   DSH 开屏动画 一键安装
echo   作者：抖音 @孤影    赞助：跃数AI中转站 ys666.site
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
echo.
echo   按任意键关闭本窗口...
pause >nul
