import * as fs from 'fs';
import { pathAdd, puts } from '../main';
import Functions from './functions.js';
import { BrowserWindow } from 'electron';

const logos = require('../logos.json');

export default class HandlerConfigFile {
  static default_config: any = {
    cliente: 'agrodemi',
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
    is_db_local: false,
    calcular_itbis: false,
    is_produccion: true,
    facturacion_editar_precio: false,
    vende_sin_inventario: false,
    medida_producto_terminado: 'Quintal',

    printer_selected: {
      venta_contado: 'Ninguna',
      venta_credito: 'Ninguna',
      pre_venta: 'Ninguna',
      cotizacion: 'Ninguna',
      compra: 'Ninguna',
      recibo_ingreso: 'Ninguna',
      conduce: 'Ninguna',
      nota: 'Ninguna',
      cuadre_caja: 'Ninguna',
      reporte: 'Ninguna',
    },

    pages_sizes: {
      venta_contado: '8.5x5.5',
      venta_credito: '8.5x11',
      pre_venta: '8.5x5.5',
      cotizacion: '8.5x5.5',
      compra: '8.5x5.5',
      recibo_ingreso: '8.5x5.5',
      conduce: '8.5x5.5',
      nota: '8.5x5.5',
      cuadre_caja: '8.5x5.5',
      reporte: '8.5x11',
    },

    plantillas_impresion: {
      nota: 'Detallada',
    },

    documentos_a_imprimir: 'recibo_ingreso,conduce,pre_venta,venta_credito,venta_contado,nota,cotizacion',
  };

  static checkConfigFile(win: BrowserWindow): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const config_path = await pathAdd('/app_config.config');

      const existe_archivo_config = fs.existsSync(config_path);

      setTimeout(() => {
        puts(existe_archivo_config, ':::::::: existe_archivo_config');

        if (!existe_archivo_config) {
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
