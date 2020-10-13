@echo off   

echo.
echo.
echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
echo "               COMPILANDO ELECTRON"
echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-" 
echo.
echo.

echo "----- borrado de la carpet de la ultima release -----"
echo "rmdir /s /q "actualizacion" "
rmdir /s /q "actualizacion" 
echo Presione enter para continuar ...
echo.
echo.
TIMEOUT 2  > nul

echo.
echo "----- borrado del zip de la ultima release -----"
echo "del actualizacion.zip"
del actualizacion.zip 
echo Presione enter para continuar ...
echo.
echo.
TIMEOUT 2  > nul

echo.
echo "----- cambio de nombre carpeta release -----"
echo "ren release actualizacion"
ren release actualizacion
echo Presione enter para continuar
echo.
echo.
TIMEOUT 2  > nul

echo. 
echo "----- borrado de la carpeta innecesaria en actualizacion -----"
echo "rmdir /s /q 'actualizacion/win-unpacked/' "
rmdir /s /q "actualizacion/win-unpacked/" 
echo Presione enter para continuar
echo.
echo.
TIMEOUT 2  > nul

echo. 
echo "----- comprimiendo archivo actualizacion -----"
echo "powershell "Compress-Archive actualizacion actualizacion.zip""
powershell "Compress-Archive actualizacion actualizacion.zip"
echo Estas a punto de subir los archivos al servidor, presione ENTER para seguir...
echo.
echo.
TIMEOUT 2  > nul

echo.
echo "----- copiando zip a server -----"
echo "scp -r actualizacion.zip vjose1903@admservidor.ddns.net:/home/vjose1903 "
scp -r actualizacion.zip vjose1903@admservidor.ddns.net:/home/vjose1903 
echo Presione enter para continuar
echo.
echo.
TIMEOUT 2  > nul

echo.
echo "----- conectando con el server -----"
echo  "ssh vjose1903@admservidor.ddns.net"
ssh vjose1903@admservidor.ddns.net
echo Fin...
echo Fin...
 


