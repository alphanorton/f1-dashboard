@echo off
setlocal
title F1 Dashboard 2026
pushd "%~dp0"
if errorlevel 1 goto path_error

echo ========================================
echo   F1 Dashboard 2026
echo ========================================
echo.

where node.exe >nul 2>&1
if errorlevel 1 goto node_error
where npm.cmd >nul 2>&1
if errorlevel 1 goto node_error
node -e "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if errorlevel 1 goto node_error

if not exist "package.json" goto project_error
if not exist "package-lock.json" goto project_error

echo [1/3] Preparing dependencies. Internet may be required...
if not exist "node_modules" (
    call npm.cmd install --include=dev --prefer-offline --no-audit --no-fund
    if errorlevel 1 goto install_error
) else (
    echo node_modules already exists, skipping install
)

echo.
echo [2/3] Building dashboard...
call npm.cmd run build
if errorlevel 1 goto build_error

echo.
echo [3/3] Opening dashboard in your browser...
echo Port 3001 is preferred; a free port is selected if it is busy.
echo Keep this window open. Press Ctrl+C to stop this dashboard.
echo Live data requires an internet connection.
echo.
call npm.cmd run preview -- --host 127.0.0.1 --port 3001 --open
if errorlevel 1 goto server_error
popd
exit /b 0

:node_error
echo ERROR: Install Node.js LTS version 22 or newer from https://nodejs.org/
echo Then reopen this file.
goto failed

:project_error
echo ERROR: Project files are missing. Extract the entire project before starting.
goto failed

:install_error
echo ERROR: Dependencies could not be installed.
echo Check your internet connection and folder permissions, then try again.
goto failed

:build_error
echo ERROR: Build failed. See the error above.
goto failed

:server_error
echo ERROR: Server could not start. See the error above.
goto failed

:failed
pause
popd
exit /b 1

:path_error
echo ERROR: Cannot access the project folder. Extract it to a writable folder.
pause
exit /b 1
