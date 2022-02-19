import * as fs from 'fs';

import { pathAdd } from '../main';
import Functions from './functions.js';
const logos = require('../logos.json');

export default class HandlerConfigFile {
  static default_config = {
    nombre_empresa: 'ADM Agroindustrial S.R.L',
    rnc_empresa: '131-99603-5',
    direccion_empresa: 'Autopista Duarte Km0 El Higüero, La Vega',
    telefono_empresa: '809-573-0060',
    logo_empresa: logos.normal,
    logo_impresion: logos.impresion,
    color_app: 'green',
    url_servidor: 'http://admservidor.ddns.net:9090',
    url_servidor_respaldo: 'http://10.0.0.9:9090',
    url_servidor_descargas: 'http://admservidor.ddns.net:9090',
    config_password: 'SW4kcDB0Z3VAcmQVMj$pt30r=',
    is_development: null,
  };

  static checkConfigFile() {
    if (!fs.existsSync(pathAdd('/app_config.config'))) {
      Functions.setConfigFile(JSON.stringify(this.default_config)).then(() => {
        console.log('------ ARCHIVO DE CONFIGURACION CREADO ------ ');
      });
    }
  }
}
