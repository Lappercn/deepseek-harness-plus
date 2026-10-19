@echo off
chcp 65001 >nul
title DeepSeek Harness 鐨偆 路 寮€灞忓姩鐢?涓€閿畨瑁?echo.
echo   DeepSeek Harness 鐨偆 路 寮€灞忓姩鐢?echo   浣滆€咃細璺冩暟AI (1.0 鐏垫劅鏉ユ簮锛氭姈闊?@瀛ゅ奖)
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
echo.
echo   鎸変换鎰忛敭鍏抽棴鏈獥鍙?..
pause >nul
