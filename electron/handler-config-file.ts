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
    rnc_empresa: '132-35083-9',
    telefono_empresa: '(829)-423-1678',
    url_servidor: 'http://novac-brendy.ddns.net:3000',
    url_servidor_descargas: 'http://novac-brendy.ddns.net:3000',
    url_servidor_respaldo: 'http://10.0.0.10:3000',
    usa_url_principal: true,
    printer_caja_selected: null,
    printer_reportes_selected: null,
    is_db_local: true,
    pages_sizes: {
      recibo_ingreso: '80mm_roll',
      nota: '80mm_roll',
      conduce: '80mm_roll',
      facturacion: '80mm_roll',
      cuadre_caja: '80mm_roll',
      reporte: '8.5x11',
    },
  };

  static checkConfigFile(win: BrowserWindow) {
    return new Promise<any>(async (resolve, reject) => {
      const config_path = await pathAdd('/app_config.config');

      if (!fs.existsSync(config_path)) {
        this.default_config.printer_caja_selected = Functions.getDefaultPrinter(win);
        this.default_config.printer_reportes_selected = Functions.getDefaultPrinter(win);

        Functions.setConfigFile(JSON.stringify(this.default_config))
          .then(() => {
            console.log('------ ARCHIVO DE CONFIGURACION CREADO ------ ');
            resolve(true);
          })
          .catch((err) => reject(false));
      } else {
        resolve(true);
      }
    });
  }
}
