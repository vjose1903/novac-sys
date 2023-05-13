import { fun } from './../functions.service';
/* eslint-disable @typescript-eslint/indent */
import { styles_ } from './utils/files';
import { getContentWithTablaNormal } from './utils/tabla_normal';
import { getContentWithTablaAgrupada } from './utils/tabla_agrupada';
import { Ss } from '../singleton.service';
import { ConfigI } from '../../typescript/config-interface.utils';
import { config_ventas } from './8.5x5.5/configuraciones/reportes/ventas';
import { config_cxc } from './8.5x5.5/configuraciones/reportes/cxc';
import { config_cxc_ant_preventa } from './8.5x5.5/configuraciones/reportes/cxc_ant_preventa';
import { config_ventas_cliente } from './8.5x5.5/configuraciones/reportes/ventas_cliente';
import { config_cxc_preventa } from './8.5x5.5/configuraciones/reportes/cxc_preventa';
import { config_cxc_ant } from './8.5x5.5/configuraciones/reportes/cxc_ant';
import { config_inventario } from './8.5x5.5/configuraciones/reportes/inventario';
import { config_recibos } from './8.5x5.5/configuraciones/reportes/recibos';
import { config_ventas_prod } from './8.5x5.5/configuraciones/reportes/ventas_prod';
import { config_cuentas_pagos } from './8.5x5.5/configuraciones/reportes/cuentas_con_pagos';
import { config_suplidor_prod } from './8.5x5.5/configuraciones/reportes/suplidor_prod';
import { config_notas } from './8.5x5.5/configuraciones/reportes/notas';
import { config_movimientos_vehiculo } from './8.5x5.5/configuraciones/reportes/movimientos_vehiculo';

const configuraciones = {
  // ventas_diarias
  // ventas_rango

  ventas_diarias: config_ventas.detallado,
  ventas_diarias_itbis: config_ventas.detallado_itbis,

  ventas_rango: config_ventas.detallado,
  ventas_rango_itbis: config_ventas.detallado_itbis,

  ventas_rango_agrupado: config_ventas.agrupado,
  ventas_rango_agrupado_itbis: config_ventas.agrupado_itbis,

  cxc: config_cxc,
  cxc_preventa: config_cxc_preventa,
  ventas_cliente: config_ventas_cliente,

  cxc_ant_detallado: config_cxc_ant.detallado,
  cxc_ant_detallado_preventa: config_cxc_ant_preventa.detallado,

  cxc_ant_agrupado: config_cxc_ant.agrupado,
  inventario: config_inventario,

  recibos: config_recibos.detallado,
  recibos_agrupado: config_recibos.agrupado,

  ventas_productos: config_ventas_prod,
  cuentas_con_pagos: config_cuentas_pagos,
  suplidor_prod: config_suplidor_prod,
  notas: config_notas,
  movimientos_vehiculo: config_movimientos_vehiculo,
};

// ==========================================================================================================================================================
// UNIR REPORTE
// ==========================================================================================================================================================

export function makeReporte(data) {
  const configuration = configuraciones[data.tipo_reporte];

  const pageO = configuration['pageOrient'] ? configuration['pageOrient'] : 'portrait';
  const configApp: ConfigI = Ss.configServ.getConfig({ isPromise: false });

  const margin_top = data.mostrar_sub_titulo ? 125 : 111.5;
  const dd = {
    pageSize: 'LETTER',
    pageMargins: [10, margin_top, 15, 40],

    pageOrientation: pageO,
    header: cabeceraReporte(data, configuration, configApp),
    content: contenidoReporte(data, configuration),
    footer: (currentPage, pageCount) => {
      return [{ text: ' ', alignment: 'right', style: 'letra10', margin: [0, 0, 20, 0] }];
    },
    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
    },
    styles: styles_,
  };

  const obj = { doc: dd, file: 'reporte.pdf', type: 'base64', pageOrientation: pageO };

  return obj;
}

// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraReporte(data, configuration, configApp: ConfigI) {
  const header = (currentPage, pageCount) => {
    const pag = currentPage.toString() + ' de ' + pageCount;
    return [
      {
        margin: [15, 15, 15, 0],
        columns: [
          {
            width: '*',
            margin: [30, 0, 0, 0],
            stack: [{ image: 'logo', width: 75, opacity: 0.85 }],
          },

          {
            width: 'auto',
            stack: [
              {
                stack: [
                  {
                    text: [
                      { text: 'Pag... :  ', style: 'letra10', bold: true },
                      { text: pag, style: 'letra10' },
                    ],
                    alignment: 'left',
                  },
                  {
                    text: [
                      { text: 'Fecha : ', style: 'letra10', bold: true },
                      { text: data.fecha, style: 'letra10' },
                    ],
                    alignment: 'left',
                    margin: [0, 3, 0, 0],
                  },
                  {
                    text: [
                      { text: 'Emp... :  ', style: 'letra10', bold: true },
                      { text: data.realizado_por, style: 'letra10' },
                    ],
                    alignment: 'left',
                    margin: [0, 3, 0, 0],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        margin: [0, -65, 0, 0],
        stack: [
          { text: configApp.nombre_empresa, alignment: 'center', bold: true, style: 'letra11' },
          { text: configApp.direccion_empresa, alignment: 'center', style: 'letra8' },
          {
            text: [
              { text: 'Telefono: ', style: 'letra9', bold: true },
              { text: configApp.telefono_empresa, style: 'letra9' },
              { text: ' RNC: ', style: 'letra9', bold: true },
              { text: configApp.rnc_empresa, style: 'letra9' },
            ],
            alignment: 'center',
          },
        ],
      },

      {
        text: [{ text: data.titulo_reporte, style: 'letra12', bold: true }],
        margin: [0, 15, 0, 0],
        alignment: 'center',
      },
      data.mostrar_sub_titulo ? { text: data.sub_titulo, style: 'letra10', margin: [15, 10, 0, 0] } : { text: '' },
    ];
  };

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================

function contenidoReporte(data, configuration) {
  let content = [];

  if (data.tipo_tabla == 'agrupado') {
    content = getContentWithTablaAgrupada(configuration, data);
  } else {
    content = getContentWithTablaNormal(configuration, data);
  }
  // fun.pushAt(content, 0, '123456789 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52');
  // fun.pushAt(content, 0, '111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111');
  // fun.pushAt(content, 0, '..........................................................................................................................................');
  // fun.pushAt(content, 0, '__________________________________________________________________________________________________________________________________________');

  return content;
}
