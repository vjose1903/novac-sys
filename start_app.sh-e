#!/bin/bash

green=$(tput setaf 2)
red=$(tput setaf 1)
white=$(tput setaf 7)
yellow=$(tput setaf 3)
cyan=$(tput setaf 6)

OPTIONS="c:r:s"

setClient() {
  client=$OPTARG

  echo "${cyan}setClient >> ${client}"
  echo "${white} "
  if [ "$client" == "agrodemi" -o "$client" == "brendy" ]; then
    node setup.ts $client
  else
    echo "${red}*************************************"
    echo "${red}**                                 **"
    echo "${red}**      CLIENTE NO ENCONTRADO      **"
    echo "${red}**                                 **"
    echo "${red}*************************************"
    exit 2
  fi
}

setRunPart() {
  run=$OPTARG

  echo "${yellow}run >> ${run}"
  echo "${white} "

  if [ "$run" == "electron" -o "$run" == "ng" -o "$run" == "all" ]; then
    case "${run}" in
      ng)
        npmCommand ng:serve
        ;;
      electron)
        npmCommand electron:serve
        ;;
      all)
        npmCommand start
        ;;
      *)
        exit 2
        ;;
    esac
  else
    echo "${red}**************************************"
    echo "${red}**                                  **"
    echo "${red}**      RUN PART NO ENCONTRADO      **"
    echo "${red}**                                  **"
    echo "${red}**************************************"
    exit 2
  fi
}

npmCommand() {
  echo "${cyan}command ... ${command}"
  echo "${white} "

  command=$1

  npm run $command $is_background
}

while getopts $OPTIONS opt; do
  echo " "
  case "${opt}" in
  c)
    echo "la opcion -c"
    setClient
    ;;
  r)
    echo "la opcion -r"
    setRunPart
    ;;
  *)
    echo "${red}*************************************"
    echo "${red}**                                 **"
    echo "${red}**        FLAG NO PERMITIDO        **"
    echo "${red}**                                 **"
    echo "${red}*************************************"
    exit 2
    ;;
  esac
done
