import * as fs from 'fs';
import { pathAdd, puts } from '../main';
import Functions from './functions.js';
import { BrowserWindow } from 'electron';

const logos = require('../logos.json');

export default class HandlerConfigFile {
  static default_config = {
    color_app: 'green',
    config_password: 'SW4kcDB0Z3VAcmQVMj$pt30r=',
    direccion_empresa: 'C. Juana Saltitopa No. 37, Villa Real, La Vega. R.D.',
    logo_empresa: logos.logo_empresa,
    logo_impresion: logos.logo_impresion,
    nombre_empresa: 'D Vásquez Services y Asociados, S.R.L',
    rnc_empresa: '130-74935-4',
    telefono_empresa: '(809) 573-3934',
    url_servidor: 'http://novac-vasquez.ddns.net:9090',
    url_servidor_descargas: 'http://novac-vasquez.ddns.net:9090',
    url_servidor_respaldo: 'http://10.0.0.9:9090',
    usa_url_principal: true,
    printer_caja_selected: null,
    printer_reportes_selected: null,
    is_db_local: false,
    facturacion_editar_precio: false,
    vende_sin_inventario: false,
    medida_producto_terminado: 'Producto',

    pages_sizes: {
      recibo_ingreso: '8.5x5.5',
      nota: '8.5x5.5',
      conduce: '8.5x5.5',
      facturacion: '8.5x5.5',
      cuadre_caja: '8.5x5.5',
      reporte: '8.5x11',
    },

    documentos_a_imprimir: 'recibo_ingreso,conduce,pre_venta,venta_credito,venta_contado,nota',
  };

  static checkConfigFile(win: BrowserWindow): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const config_path = await pathAdd('/app_config.config');

      const existe_archivo_config = fs.existsSync(config_path);

      setTimeout(() => {
        puts(existe_archivo_config, ':::::::: existe_archivo_config');

        if (!existe_archivo_config) {
          // TODO: ver cual es el key que se necesita para utilizar una impresora por nombre
          this.default_config.printer_caja_selected = Functions.hasValue(Functions.getDefaultPrinter(win)) ? Functions.getDefaultPrinter(win) : null;
          this.default_config.printer_reportes_selected = Functions.hasValue(Functions.getDefaultPrinter(win)) ? Functions.getDefaultPrinter(win) : null;

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
