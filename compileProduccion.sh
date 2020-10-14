# npm run build:ssr
# loquesea=$?

# if [[ $loquesea -eq 0 ]]; then
# echo "NO HAY ERROR"
npm run electron:serve-tsc
npm run electron:windows64

rm -rf actualizacion
rm -rf actualizacion.zip
mv release actualizacion
rmdir /s /q "actualizacion/win-unpacked/"

powershell "Compress-Archive actualizacion actualizacion.zip"

scp -r actualizacion.zip vjose1903@admservidor.ddns.net:/home/vjose1903
ssh vjose1903@admservidor.ddns.net 'sh actualizarAppAdm.sh'
# ssh ubuntu@34.74.90.82 'sh /home/ubuntu/updateWebLotedom.sh'
# fi
