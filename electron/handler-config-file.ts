import * as fs from 'fs';
import { pathAdd } from '../main';
import Functions from './functions.js';
import { BrowserWindow } from 'electron';

const logos = require('../logos.json');

export default class HandlerConfigFile {
  static default_config = {
    color_app: 'green',
    config_password: 'SW4kcDB0Z3VAcmQVMj$pt30r=',
    direccion_empresa: 'Autopista Duarte Km0 El Higüero, La Vega',
    logo_empresa: logos.logo_empresa,
    logo_impresion: logos.logo_impresion,
    nombre_empresa: 'Agropecuaria Delia y Milo, S.R.L AGRODEMI',
    rnc_empresa: '131-99603-5',
    telefono_empresa: '(809)-573-0060',
    url_servidor: 'http://admservidor.ddns.net:9090',
    url_servidor_descargas: 'http://admservidor.ddns.net:9090',
    url_servidor_respaldo: 'http://10.0.0.9:9090',
    usa_url_principal: true,
    printer_caja_selected: null,
    printer_reportes_selected: null,
    pages_sizes: {
      recibo_ingreso: '8.5x5.5',
      conduce: '8.5x5.5',
      facturacion: '8.5x5.5',
      cuadre_caja: '8.5x5.5',
      reporte: '8.5x11',
    },
  };

  static checkConfigFile(win: BrowserWindow) {
    if (!fs.existsSync(pathAdd('/app_config.config'))) {
      this.default_config.printer_caja_selected = Functions.getDefaultPrinter(win);
      this.default_config.printer_reportes_selected = Functions.getDefaultPrinter(win);

      Functions.setConfigFile(JSON.stringify(this.default_config)).then(() => {
        console.log('------ ARCHIVO DE CONFIGURACION CREADO ------ ');
      });
    }
  }
}
