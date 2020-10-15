@echo off

echo Estas a punto de actualizar la aplicacion de ADM agroindustrial presione ENTER para continuar
pause>nul
cd c:\adm-agroindustrial
npm run electron:serve-tsc & npm run electron:windows64 & compilarElectron.bat
