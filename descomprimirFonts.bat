@echo off   

echo.
echo.
echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
echo "              Descomprimiendo fuentes"
echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-" 
echo.
echo.

TIMEOUT 4  > nul
cd .. 

echo. 
echo "----- descomprimiendo archivo fonts -----"
echo "powershell Expand-Archive fonts.zip -DestinationPath fonts"
powershell Expand-Archive fonts.zip -DestinationPath fonts
echo.
echo.
TIMEOUT 3  > nul

echo.
echo "----- borrado del zip de las fuentes -----"
echo "del fonts.zip"
del fonts.zip 
echo.
echo.
TIMEOUT 3  > nul