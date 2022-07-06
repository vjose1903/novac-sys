/* eslint-disable @typescript-eslint/indent */
import { styles_ } from './utils/files';
import { getConfiguration } from './configuracion_tablas';
import { getContentWithTablaNormal } from './tabla_normal';
import { getContentWithTablaAgrupada } from './tabla_agrupada';
import { SingletonService } from '../singleton.service';
import { ConfigI } from '../../typescript/config-interface';

// ==========================================================================================================================================================
// UNIR REPORTE
// ==========================================================================================================================================================

export function makeReporte(data) {
  const configuration = getConfiguration(data.tipo_reporte);
  const pageO = configuration['pageOrient'] ? configuration['pageOrient'] : 'portrait';
  const configApp: ConfigI = SingletonService.configServ.getConfig({ isPromise: false });

  const dd = {
    // pageSize: { width: 990, height: 398 },
    pageMargins: [10, data.mostrar_sub_titulo ? 125 : 111.5, 10, 30],
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

  const obj = { doc: dd, file: 'reporte.pdf', type: 'base64', scale: configuration['pageOrient'] ? (configuration['pageOrient'] === 'landscape' ? 'fit' : 'noscale') : 'noscale' };

  return obj;
}

// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraReporte(data, configuration, configApp: ConfigI) {
  const header = (currentPage, pageCount) => {
    const pageO = configuration['pageOrient'] ? configuration['pageOrient'] : 'portrait';
    const pag = currentPage.toString() + ' de ' + pageCount;
    return [
      {
        columns: [
          [{ image: 'logo', width: 52, opacity: 0.85, margin: [20, 12, 0, 0] }],

          [
            {
              margin: [0, 17, 0, 0],
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
          ],
          [
            {
              margin: [pageO === 'portrait' ? 0 : 80, 10, 0, 0],
              stack: [
                {
                  text: [
                    { text: 'Pag... :  ', style: 'letra10', bold: true },
                    { text: pag, style: 'letra10' },
                  ],
                  alignment: 'left',
                  margin: [60, 19, 0, 0],
                },
                {
                  text: [
                    { text: 'Fecha : ', style: 'letra10', bold: true },
                    { text: data.fecha, style: 'letra10' },
                  ],
                  alignment: 'left',
                  margin: [60, 3, 0, 0],
                },
                {
                  text: [
                    { text: 'Emp... :  ', style: 'letra10', bold: true },
                    { text: data.realizado_por, style: 'letra10' },
                  ],
                  alignment: 'left',
                  margin: [60, 3, 0, 0],
                },
              ],
            },
          ],
        ],
      },

      {
        text: [{ text: data.titulo_reporte, style: 'letra12', bold: true }],
        margin: [0, 15, 0, 0],
        alignment: 'center',
      },
      data.mostrar_sub_titulo ? { text: data.sub_titulo, style: 'letra10', margin: [15, 10, 0, 0] } : { text: '' },

      { canvas: [{ type: 'rect', x: 10, y: data.mostrar_sub_titulo ? 2 : 10, w: pageO === 'portrait' ? 575 : 823, h: 1.5, color: '#000000' }] },
    ];
  };

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================

function contenidoReporte(data, configuration) {
  let content = [];

  if (data.tipo_tabla === 'agrupado') {
    content = getContentWithTablaAgrupada(configuration, data);
  } else {
    content = getContentWithTablaNormal(configuration, data);
  }

  return content;
}
