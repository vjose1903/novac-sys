import { ConfigI } from '../src/app/core/typescript/config-interface.js';
import * as fs from 'fs';
import { pathAdd, puts } from '../main.js';
import Functions from './functions.js';
import { BrowserWindow } from 'electron';

const logos = require('../logos.json');

export default class HandlerConfigFile {
  static default_config: ConfigI = {
    cliente: 'demo',
    color_app: 'blue',
    mode_app: 'light',
    config_password: 'SW4kcDB0Z3VAcmQVMj$pt30r=',
    direccion_empresa: 'La Vega República Dominicana',
    logo_empresa: logos.logo_empresa,
    logo_impresion: logos.logo_impresion,
    nombre_empresa: 'Inspot Technology',
    rnc_empresa: '000-00000-0',
    telefono_empresa: '(809) 879-0161',
    url_servidor: 'https://8n3mw1zq-9093.use2.devtunnels.ms:9093',
    url_servidor_descargas: 'https://8n3mw1zq-9093.use2.devtunnels.ms:9093',
    url_servidor_respaldo: 'https://8n3mw1zq-9093.use2.devtunnels.ms:9093',
    usa_url_principal: true,
    has_contabilidad: true,
    is_db_local: false,
    calcular_itbis: true,
    is_produccion: false,
    facturacion_editar_precio: false,
    vende_sin_inventario: false,
    medida_producto_terminado: 'Producto',

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

    documentos_a_imprimir: 'conduce',
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
