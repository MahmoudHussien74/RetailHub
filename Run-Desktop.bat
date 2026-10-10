@echo off
title RetailHub POS - نظام إدارة المخازن ونقاط البيع
color 0b
echo ========================================================
echo    جار تشغيل تطبيق RetailHub Desktop...
echo ========================================================
cd /d "%~dp0client"
call npm run electron
