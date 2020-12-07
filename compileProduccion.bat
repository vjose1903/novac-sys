@echo off

echo Estas a punto de actualizar la aplicacion de ADM agroindustrial presione ENTER para continuar
pause>nul
cd C:\Users\USER\adm-agroindustrial-codigo
npm run electron:serve-tsc & npm run electron:windows64 & compilarElectron.bat
