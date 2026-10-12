@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动汤甜甜课程作品集...
echo.
rem Prefer the Windows Python Launcher; fall back to a PATH Python installation.
py -3 --version >nul 2>&1
if not errorlevel 1 (
    py -3 start_server.py
    goto :done
)
python --version >nul 2>&1
if not errorlevel 1 (
    python start_server.py
    goto :done
)
echo 未找到可用的 Python 3。
echo 请安装 Python 3，并在安装时勾选 Add Python to PATH。
echo 安装完成后，重新双击本文件。
pause
exit /b 1
:done
if errorlevel 1 (
    echo 服务器启动失败，请查看上方提示。
    pause
)
endlocal
