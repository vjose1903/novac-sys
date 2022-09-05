import * as fs from 'fs';
import { pathAdd, puts } from '../main';
import Functions from './functions.js';
import { BrowserWindow } from 'electron';

const logos = require('../logos.json');

export default class HandlerConfigFile {
  static default_config: any = {
    color_app: 'red',
    config_password: 'SW4kcDB0Z3VAcmQVMj$pt30r=',
    direccion_empresa: 'El higuerito, frente a la escuela, La Vega Rep. Dom.',
    logo_empresa: logos.logo_empresa,
    logo_impresion: logos.logo_impresion,
    nombre_empresa: 'Panaderia & Reposteria Brendy',
    rnc_empresa: '132-35083-9',
    telefono_empresa: '(829)-423-1678',
    url_servidor: 'http://novac-brendy.ddns.net:3001',
    url_servidor_descargas: 'http://novac-brendy.ddns.net:3001',
    url_servidor_respaldo: 'http://localhost:3001',
    usa_url_principal: false,
    printer_caja_selected: undefined,
    printer_reportes_selected: undefined,
    is_db_local: true,
    calcular_itbis: false,
    is_produccion: true,
    facturacion_editar_precio: true,
    vende_sin_inventario: true,
    medida_producto_terminado: 'Producto',

    pages_sizes: {
      recibo_ingreso: '80mm_roll',
      nota: '80mm_roll',
      conduce: '80mm_roll',
      facturacion: '80mm_roll',
      cuadre_caja: '80mm_roll',
      reporte: '8.5x11',
    },

    plantillas_impresion: {
      nota: 'Agrupada',
    },

    documentos_a_imprimir: 'nota,venta_credito,pre_venta,recibo_ingreso,conduce',
  };

  static checkConfigFile(win: BrowserWindow): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const config_path = await pathAdd('/app_config.config');

      const existe_archivo_config = fs.existsSync(config_path);

      setTimeout(() => {
        puts(existe_archivo_config, ':::::::: existe_archivo_config');

        if (!existe_archivo_config) {
          // TODO: ver cual es el key que se necesita para utilizar una impresora por nombre
          this.default_config.printer_caja_selected = Functions.hasValue(Functions.getDefaultPrinter(win)) ? Functions.getDefaultPrinter(win) : undefined;
          this.default_config.printer_reportes_selected = Functions.hasValue(Functions.getDefaultPrinter(win)) ? Functions.getDefaultPrinter(win) : undefined;

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
