import * as fs from 'fs';
import { pathAdd } from '../main';
import Functions from './functions.js';
import { BrowserWindow } from 'electron';

const logos = require('../logos.json');

export default class HandlerConfigFile {
  static default_config = {
    color_app: 'red',
    config_password: 'SW4kcDB0Z3VAcmQVMj$pt30r=',
    direccion_empresa: 'El higuerito, frente a la escuela, La Vega Rep. Dom.',
    logo_empresa: logos.logo_empresa,
    logo_impresion: logos.logo_impresion,
    nombre_empresa: 'Panaderia & Reposteria Brendy',
    rnc_empresa: '000-00000-0',
    telefono_empresa: '(829)-423-1678',
    url_servidor: 'http://admservidor.ddns.net:9090',
    url_servidor_descargas: 'http://admservidor.ddns.net:9090',
    url_servidor_respaldo: 'http://10.0.0.9:9090',
    usa_url_principal: true,
    printer_caja_selected: null,
    printer_reportes_selected: null,
    pages_sizes: {
      recibo_ingreso: '80mm_roll',
      conduce: '80mm_roll',
      facturacion: '80mm_roll',
      cuadre_caja: '80mm_roll',
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
