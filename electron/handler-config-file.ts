import * as fs from 'fs';
import { pathAdd, puts } from '../main';
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
    url_servidor_respaldo: 'http://localhost:3000',
    usa_url_principal: false,
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
    documentos_a_imprimir: [
      { key: 'venta_contado', selected: false },
      { key: 'venta_credito', selected: false },
      { key: 'pre_venta', selected: false },
      { key: 'compra', selected: false },
      { key: 'recibo_ingreso', selected: false },
      { key: 'nota', selected: false },
      { key: 'conduce', selected: false },
      { key: 'cuadre_caja', selected: false },
    ],
  };

  static checkConfigFile(win: BrowserWindow) {
    return new Promise<any>(async (resolve, reject) => {
      const config_path = await pathAdd('/app_config.config');

      const existe_archivo_config = fs.existsSync(config_path);

      setTimeout(() => {
        puts(existe_archivo_config, ':::::::: existe_archivo_config');

        if (!existe_archivo_config) {
          this.default_config.printer_caja_selected = Functions.getDefaultPrinter(win);
          this.default_config.printer_reportes_selected = Functions.getDefaultPrinter(win);

          Functions.setConfigFile(JSON.stringify(this.default_config))
            .then(() => {
              console.log(' ');
              console.log('------ ARCHIVO DE CONFIGURACION CREADO ------ ');
              console.log(' ');
              puts('------ ARCHIVO DE CONFIGURACION CREADO ------');

              setTimeout(() => resolve(true), 500);
            })
            .catch((err) => reject(false));
        } else {
          setTimeout(() => resolve(true), 500);
        }
      }, 500);
    });
  }
}
