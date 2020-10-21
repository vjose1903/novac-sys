@echo off

for /f %%j in ('powershell pwd') do set dir=%%j

for /f %%i in ('whoami') do set current_user=%%i

echo "el directorio es %dir%"
echo "el usuario es %current_user%"

echo icacls %dir% /grant[:r] %current_user%:(F)
icacls %dir% /grant[:r] %current_user%:(F)
pause



