@echo off
cls
echo.
echo.
echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
echo "               COMPILANDO ELECTRON"
echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
echo.
echo.

cd "C:\Users\victor vasquez\codigo fuente adm\adm-agroindustrial"

echo "----- borrado de la carpet de la ultima release -----"
echo "Remove-item ".\actualizacion\" -Recurse -Force -Verbose"
Remove-item ".\actualizacion\" -Recurse -Force -Verbose
echo.
echo.
TIMEOUT 3  > nul

echo.
echo "----- borrado del zip de la ultima release -----"
echo "del actualizacion.zip"
del actualizacion.zip
echo.
echo.
TIMEOUT 3  > nul

echo.
echo "----- borrado de la carpeta innecesaria en actualizacion -----"
echo "Remove-item "actualizacion/win-unpacked/" -Recurse -Force -Verbose "
Remove-item "actualizacion/win-unpacked/" -Recurse -Force -Verbose
echo.
echo.
TIMEOUT 3  > nul

echo.
echo "----- comprimiendo archivo actualizacion -----"
echo "powershell 'Compress-Archive actualizacion actualizacion.zip' -Update"
powershell "Compress-Archive actualizacion actualizacion.zip" -Update
echo.
echo.
TIMEOUT 3  > nul

echo.
echo "----- copiando zip a server -----"
echo "scp -r actualizacion.zip vjose1903@admservidor.ddns.net:/home/vjose1903 "
scp -r actualizacion.zip vjose1903@admservidor.ddns.net:/home/vjose1903
echo.
echo.
TIMEOUT 3  > nul

echo.
echo "----- conectando con el server -----"
echo  "ssh vjose1903@admservidor.ddns.net"
ssh vjose1903@admservidor.ddns.net
echo Fin...



