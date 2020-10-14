# npm run build:ssr
# loquesea=$?

# if [[ $loquesea -eq 0 ]]; then
# echo "NO HAY ERROR"

npm run electron:windows64

rm -rf actualizacion
rm -rf actualizacion.zip
mv release actualizacion
zip -r actualizacion.zip actualizacion -x "*.DS_Store"
scp html.zip vjose1903@admservidor.ddns.net
ssh vjose1903@admservidor.ddns.net
# ssh ubuntu@34.74.90.82 'sh /home/ubuntu/updateWebLotedom.sh'
# fi
