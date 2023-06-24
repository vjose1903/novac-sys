import { ConfigService } from './../configuration.service';
/* eslint-disable @typescript-eslint/indent */
import * as fun_ from './utils/funciones';
import { styles_ } from './utils/files';
import { ConfigI } from '../../typescript/config-interface.utils';

// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================

export function makePDF(data) {
  try {
    const dd = {
      pageSize: { width: 600, height: 398 },
      pageMargins: [15, 159.5, 15, 15],
      header: (currentPage, pageCount, pageSize) => cabeceraReporte(data, ConfigService.config, currentPage, pageCount),
      content: contenidoReporte(data),
      images: {
        logo: `data:image/png;base64,${ConfigService.config.logo_impresion}`,
      },
      styles: styles_,
    };

    const obj = { doc: dd, file: 'cuadre.pdf', type: 'base64', pageOrientation:'portrait' };
    return obj;
  } catch (error) {
    return error;
  }
}

// ====================================================================================================================================================
// CABECERA
// ====================================================================================================================================================
function cabeceraReporte(data, configApp: ConfigI, currentPage, pageCount) {
  try {
    const header = [
      {
        margin: [15, 15, 15, 0],
        columns: [
          [
            { text: 'pag: ' + currentPage.toString() + ' de ' + pageCount, alignment: 'left', style: 'letra9' },
            { image: 'logo', width: 50, height: 45, margin: [60, -15, 0, 0] },
          ],
          [
            {
              stack: [
                {
                  alignment: 'right',
                  text: [
                    { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra10', bold: true },
                    { text: ' - ' + fun_.my_houreFormater(data.fecha_equivalente), style: 'letra10', bold: true },
                  ],
                },

                {
                  alignment: 'right',
                  text: [
                    {
                      text: [{ text: 'no: ', style: 'letra10', bold: false }],
                      alignment: 'right',
                    },
                    { text: fun_.my_padStart(data.numero_documento, 8, '0'), style: 'letra10', alignment: 'right' },
                  ],
                },
                {
                  alignment: 'right',
                  text: [
                    {
                      text: [{ text: 'Realizado por: ', style: 'letra10', bold: false }],
                      alignment: 'right',
                    },
                    { text: data.usuario, style: 'letra10', alignment: 'right' },
                  ],
                },
              ],
            },
          ],
        ],
      },
      {
        margin: [0, -45, 0, 0],
        stack: [
          { text: configApp.nombre_empresa, alignment: 'center', bold: true, style: 'letra11' },
          { text: configApp.direccion_empresa, alignment: 'center', style: 'letra10' },
          {
            text: [
              { text: 'Telefono: ', style: 'letra10', bold: true },
              { text: configApp.telefono_empresa + ' ', style: 'letra10' },
              { text: ' RNC: ', style: 'letra10', bold: true },
              { text: configApp.rnc_empresa, style: 'letra10' },
            ],
            alignment: 'center',
          },
        ],
      },
      { text: [{ text: 'Cuadre de caja', style: 'letra12', bold: true }], margin: [0, 30, 0, 0], alignment: 'center' },
      // =============================================================
      {
        canvas: [{ type: 'rect', x: 200, y: 5, w: 200, h: 1, color: '#000000' }],
      },

      // =============================================================
    ];

    return header;
  } catch (error) {
    throw error;
  }
}

// ================================================================================================================================================
// CONTENIDO
// =========================================================~======================================================================================

function contenidoReporte(data) {
  const body = [];

  data.contenido_reporte.forEach((detalle, i) => {
    const row = [];
    row.push({ text: detalle.titulo, alignment: 'left', bold: true, style: 'letra11' }, { text: fun_.numFormatTwoDecimals(detalle.valor), alignment: 'right', margin: [0, 0, 15, 0] });
    body.push(row);
  });

  const content = [
    {
      margin: [10, 0, 10, 0],
      columns: [
        [
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*'],
              body: [
                [
                  { text: 'Descripción', alignment: 'left', bold: true, style: 'letra11' },
                  { text: 'Monto', alignment: 'right', bold: true, style: 'letra11', margin: [0, 0, 15, 0] },
                ],
                ...body,
              ],
            },

            layout: {
              fillColor: (rowIndex, node, columnIndex) => {
                return rowIndex === 4 ? '#dcdcdc' : null;
              },
              hLineWidth: (i, node) => (i === 0 || i === 1 || i === 4 || i === 5 || i === 6 ? 2 : 1),
              vLineWidth: (i, node) => 0,
              hLineColor: (i, node) => (i === 0 || i === 1 || i === 4 || i === 5 || i === 6 ? 'black' : 'gray'),
              vLineColor: (i, node) => 'black',
            },
          },
        ],
      ],
    },
  ];
  return content;
}
