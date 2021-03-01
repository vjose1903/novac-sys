import { logoADM, styles_ } from './utils/files';
import { AppConfig } from '../src/environments/environment.js';
import { getConfiguration } from './configuracion_tablas';
import { getContentWithTablaNormal } from './tabla_normal';
import { getContentWithTablaAgrupada } from './tabla_agrupada';

// ==========================================================================================================================================================
// UNIR REPORTE
// ==========================================================================================================================================================

export function makeReporte(data) {
  const configuration = getConfiguration(data.tipo_reporte);
  const dd = {
    // pageSize: { width: 990, height: 398 },
    pageMargins: [0, data.mostrar_sub_titulo ? 118.5 : 111.5, 0, 30],
    pageOrientation: configuration.pageOrientation ? configuration.pageOrientation : 'portrait',
    header: cabeceraReporte(data, configuration),
    content: contenidoReporte(data, configuration),
    footer: (currentPage, pageCount) => {
      return [
        {
          text: ' ',
          alignment: 'right',
          style: 'letra10',
          margin: [0, 0, 20, 0],
        },
      ];
    },
    images: {
      logo: logoADM,
    },
    styles: styles_,
  };

  const obj = {
    doc: dd,
    file: 'reporte.pdf',
    type: 'base64',
  };
  return obj;
}

// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraReporte(data, configuration) {
  const header = (currentPage, pageCount) => {
    const pag = currentPage.toString() + ' de ' + pageCount;
    return [
      {
        columns: [
          [{ image: 'logo', width: 52, opacity: 0.85, margin: [20, 12, 0, 0] }],

          [
            {
              margin: [0, 17, 0, 0],
              stack: [
                {
                  text: 'ADM Agroindustrial S.R.L',
                  alignment: 'center',
                  bold: true,
                  style: 'letra11_5',
                },
                {
                  text: 'Autopista Duarte Km0 El Higuero, La Vega',
                  alignment: 'center',
                  style: 'letra10',
                },
                {
                  text: [
                    { text: 'Telefono: ', style: 'letra9', bold: true },
                    { text: AppConfig.num_telefono, style: 'letra9' },
                    { text: ' RNC: ', style: 'letra9', bold: true },
                    { text: AppConfig.rnc, style: 'letra9' },
                  ],
                  alignment: 'center',
                },
              ],
            },
          ],
          [
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
        ],
      },
      {
        text: [{ text: data.titulo_reporte, style: 'letra12', bold: true }],
        margin: [0, 15, 0, 0],
        alignment: 'center',
      },
      data.mostrar_sub_titulo
        ? {
            text: data.sub_titulo,
            style: 'letra10',
            margin: [15, 10, 0, 0],
          }
        : { text: '' },

      data.tipo_tabla === 'normal'
        ? {
            canvas: [
              {
                type: 'rect',
                x: 10,
                y: data.mostrar_sub_titulo ? 5 : 20,
                w: configuration.pageOrientation ? (configuration.pageOrientation === 'portrait' ? 575 : 820) : 575,
                h: 1.5,
                color: '#000000',
              },
            ],
          }
        : { text: '' },
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
