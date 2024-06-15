import { ConfigI } from '../src/app/core/typescript/config-interface';
import * as fs from 'fs';
import { pathAdd, puts } from '../main';
import Functions from './functions.js';
import { BrowserWindow } from 'electron';

const logos = require('../logos.json');

export default class HandlerConfigFile {
  static default_config: ConfigI = {
    cliente: 'brendy',
    color_app: 'red',
    mode_app: 'light',
    config_password: 'SW4kcDB0Z3VAcmQVMj$pt30r=',
    direccion_empresa: 'El higuerito, frente a la escuela, La Vega Rep. Dom.',
    logo_empresa: logos.logo_empresa,
    logo_impresion: logos.logo_impresion,
    nombre_empresa: 'Panaderia & Reposteria Brendy',
    rnc_empresa: '132-35083-9',
    telefono_empresa: '(829)-423-1678',
    url_servidor: 'http://novac-brendy.ddns.net:9091',
    url_servidor_descargas: 'http://novac-brendy.ddns.net:9091',
    url_servidor_respaldo: 'http://localhost:9091',
    usa_url_principal: false,
    has_contabilidad: false,
    is_db_local: true,
    calcular_itbis: false,
    is_produccion: true,
    facturacion_editar_precio: true,
    vende_sin_inventario: true,
    facturacion_electronica: false,
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
      venta_contado: '80mm_roll',
      venta_credito: '80mm_roll',
      pre_venta: '80mm_roll',
      cotizacion: '80mm_roll',
      compra: '80mm_roll',
      recibo_ingreso: '80mm_roll',
      conduce: '80mm_roll',
      nota: '80mm_roll',
      cuadre_caja: '80mm_roll',
      reporte: '8.5x11',
    },

    plantillas_impresion: {
      nota: 'Agrupada',
    },

    documentos_a_imprimir: 'nota,venta_credito,pre_venta,recibo_ingreso,conduce,cotizacion',
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
