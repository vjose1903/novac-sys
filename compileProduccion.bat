@echo off

echo Estas a punto de actualizar la aplicacion de ADM agroindustrial presione ENTER para continuar
pause>nul
npm run electron:windows64 & compilarElectron.bat
