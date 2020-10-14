@echo off   

echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
echo "               COMPILANDO ELECTRON"
echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-" 

echo Para seguir con la siguiente parte pulse ENTER 
pause>nul 
echo "----- borrado de la carpet de la ultima release -----"
rmdir /s /q "actualizacion" 
echo Presione enter para continuar
pause>nul  
echo "----- borrado del zip de la ultima release -----"
del actualizacion.zip 
echo Presione enter para continuar
pause>nul  
echo "----- cambio de nombre carpeta release -----"

ren release actualizacion
 
echo "----- borrado de la carpeta innecesaria en actualizacion -----"
rmdir /s /q "actualizacion/win-unpacked/" 
echo Presione enter para continuar
pause>nul  
echo "----- comprimiendo archivo actualizacion -----"
powershell "Compress-Archive actualizacion actualizacion.zip"

echo Estas a punto de subir los archivos al servidor
pause>nul  
echo "----- copiando zip a server -----"
scp -r actualizacion.zip vjose1903@admservidor.ddns.net:/home/vjose1903 
echo "----- corriendo el sh en el server -----"

echo Presione enter para continuar
pause>nul  
ssh vjose1903@admservidor.ddns.net 'sh actualizarAppAdm.sh'

echo Fin...
pause>nul 
