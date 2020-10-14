@echo off   

echo Estas a punto de actualizar la aplicacion de ADM agroindustrial presione ENTER para continuar
pause>nul  
npm run electron:serve-tsc
npm run electron:windows64

echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
echo "               COMPILADO EXITOSO"
echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-" 
echo Para seguir con la siguiente parte pulse ENTER 
pause>nul 
echo "----- borrado de la carpet de la ultima release -----"
rmdir /s /q "actualizacion" 
echo "----- borrado del zip de la ultima release -----"
del actualizacion.zip 
echo "----- cambio de nombre carpeta release -----"
mv release actualizacion
 
echo "----- borrado de la carpeta innecesaria en actualizacion -----"
rmdir /s /q "actualizacion/win-unpacked/" 
echo "----- comprimiendo archivo actualizacion -----"
powershell "Compress-Archive actualizacion actualizacion.zip"

echo Estas a punto de subir los archivos al servidor
pause>nul  
echo "----- copiando zip a server -----"
scp -r actualizacion.zip vjose1903@admservidor.ddns.net:/home/vjose1903 
echo "----- corriendo el sh en el server -----"

ssh vjose1903@admservidor.ddns.net 'sh actualizarAppAdm.sh'

echo Actualizacion realizada con exito 
pause>nul 
exit
