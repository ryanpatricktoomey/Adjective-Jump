@echo off
title Adjective Jump — Dev Server
color 0B
echo.
echo  ====================================
echo    Adjective Jump  -  Dev Server
echo  ====================================
echo.

:: Try Node / npx first
where npx >nul 2>&1
if %errorlevel%==0 (
  echo  Starting with npx serve on http://localhost:3000
  echo  Press Ctrl+C to stop.
  echo.
  npx --yes serve . -p 3000 -s
  goto :eof
)

:: Try Python 3
where python >nul 2>&1
if %errorlevel%==0 (
  echo  Starting with Python on http://localhost:3000
  echo  Press Ctrl+C to stop.
  echo.
  python -m http.server 3000
  goto :eof
)

:: Try Python 2
where python2 >nul 2>&1
if %errorlevel%==0 (
  echo  Starting with Python 2 on http://localhost:3000
  python2 -m SimpleHTTPServer 3000
  goto :eof
)

echo  ERROR: Neither Node.js nor Python found.
echo.
echo  Install one of:
echo    Node.js  ^>  https://nodejs.org
echo    Python   ^>  https://python.org
echo.
echo  Or open index.html via VS Code Live Server extension.
echo.
pause
