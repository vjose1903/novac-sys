@echo off

for /f %%j in ('powershell pwd') do set dir=%%j

set current_user=%username%

echo "el directorio es %dir%"
echo "el usuario es (%current_user%")

echo icacls c:\adm-agroindustrial\fonts /grant "%current_user%":(F) /t /c

icacls c:\adm-agroindustrial\fonts /grant[:r] "%current_user%":(f) /t /c
pause



