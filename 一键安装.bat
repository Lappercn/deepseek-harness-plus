@echo off
chcp 65001 >nul
title DeepSeek Harness 皮肤 · 开屏动画 一键安装
echo.
echo   DeepSeek Harness 皮肤 · 开屏动画
echo   作者：抖音 @孤影
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
echo.
echo   按任意键关闭本窗口...
pause >nul
