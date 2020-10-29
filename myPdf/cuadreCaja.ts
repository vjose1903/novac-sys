import * as fun_ from './utils/funciones';
import { logoADM } from './utils/files';
import { AppConfig } from '../src/environments/environment.js';

// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================

export function makeCuadre(data) {
  try {
    const dd = {
      pageSize: { width: 816, height: 528 },
      pageMargins: [10, 159.5, 10, 30],
      header: cabeceraReporte(data),
      content: contenidoReporte(data),
      footer: (currentPage, pageCount) => {
        return [
          {
            text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
            alignment: 'right',
            margin: [0, 0, 30, 0],
          },
        ];
      },
      images: {
        logo: logoADM,
      },
      styles: {
        letra10: {
          fontSize: 10,
        },
        letra11: {
          fontSize: 11,
        },
        letra12: {
          fontSize: 12,
        },
        letra13: {
          fontSize: 13,
        },
        letra14: {
          fontSize: 14,
        },
        letra15: {
          fontSize: 15,
        },
        letra17: {
          fontSize: 17,
        },
      },
    };

    const obj = {
      doc: dd,
      file: 'cuadre.pdf',
      type: 'base64',
    };
    return obj;
  } catch (error) {
    return error;
  }
}

// ====================================================================================================================================================
// CABECERA
// ====================================================================================================================================================
function cabeceraReporte(data) {
  const header = [
    {
      columns: [
        [
          {
            image: 'logo',
            width: 72,
            opacity: 0.85,
            margin: [90, 12, 0, 0],
          },
        ],
        [
          {
            margin: [0, 23, 0, 0],
            stack: [
              {
                text: 'ADM Agroindustrial S.R.L',
                alignment: 'center',
                bold: true,
                style: 'letra17',
              },
              {
                text: 'Autopista Duarte Km0 El Higuero, La Vega',
                alignment: 'center',
                fontSize: 11,
              },
              {
                text: [
                  { text: 'Telefono: ', fontSize: 9, bold: true },
                  { text: AppConfig.num_telefono + ' ', fontSize: 9 },
                  { text: ' RNC: ', fontSize: 9, bold: true },
                  { text: AppConfig.rnc, fontSize: 9 },
                ],
                alignment: 'center',
              },
            ],
          },
        ],
        [
          {
            margin: [0, 30, 30, 0],
            stack: [
              {
                alignment: 'right',
                text: [
                  { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra14', bold: true },
                  { text: ' - ' + fun_.my_houreFormater(data.fecha_equivalente), style: 'letra14', bold: true },
                ],
              },

              {
                alignment: 'right',
                text: [
                  {
                    text: [{ text: 'no: ', style: 'letra13', bold: false }],
                    alignment: 'right',
                  },
                  { text: fun_.my_padStart(data.numero_reporte, 8, '0'), style: 'letra13', alignment: 'right' },
                ],
              },
              {
                alignment: 'right',
                text: [
                  {
                    text: [{ text: 'Realizado por: ', style: 'letra13', bold: false }],
                    alignment: 'right',
                  },
                  { text: data.usuario, style: 'letra13', alignment: 'right' },
                ],
              },
            ],
          },
        ],
      ],
    },
    {
      text: [{ text: 'Cuadre de caja', style: 'letra17', bold: true }],
      margin: [0, 30, 0, 0],
      alignment: 'center',
    },
    // =============================================================
    {
      canvas: [
        {
          type: 'rect',
          x: 310,
          y: 5,
          w: 200,
          h: 2,
          color: '#000000',
        },
      ],
    },

    // =============================================================
  ];

  return header;
}

// ================================================================================================================================================
// CONTENIDO
// =========================================================~======================================================================================

function contenidoReporte(data) {
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
                  {
                    text: 'Descripción',
                    alignment: 'left',
                    bold: true,
                    style: 'letra17',
                  },
                  {
                    text: 'Monto',
                    alignment: 'right',
                    bold: true,
                    style: 'letra17',
                  },
                ],
                [
                  {
                    text: 'Total facturado a contado:',
                    alignment: 'left',
                    bold: true,
                    style: 'letra15',
                  },
                  { text: fun_.numFormatTwoDecimals(data.total_venta_contado), style: 'letra13', alignment: 'right', margin: [0, 3, 0, 0] },
                ],
                [
                  {
                    text: 'Total recibo de ingreso:',
                    alignment: 'left',
                    bold: true,
                    style: 'letra15',
                  },
                  { text: fun_.numFormatTwoDecimals(data.total_recibo_ingreso), style: 'letra13', alignment: 'right', margin: [0, 3, 0, 0] },
                ],
                [
                  {
                    text: 'Total en caja:',
                    alignment: 'left',
                    bold: true,
                    style: 'letra15',
                  },
                  { text: fun_.numFormatTwoDecimals(data.total_general), style: 'letra13', alignment: 'right', margin: [0, 3, 0, 0] },
                ],
                [
                  {
                    margin: [0, 17, 0, 0],
                    text: 'Total facturado a crédito:',
                    alignment: 'left',
                    fontSize: 16,
                  },
                  { text: fun_.numFormatTwoDecimals(data.total_venta_credito), style: 'letra13', alignment: 'right', margin: [0, 3, 0, 0] },
                ],
              ],
            },

            layout: {
              fillColor: (rowIndex, node, columnIndex) => {
                return rowIndex === 3 ? '#dcdcdc' : null;
              },
              hLineWidth: (i, node) => {
                return i === 0 || i === 1 || i === 3 || i === 4 || i === 5 ? 2 : 1;
              },
              vLineWidth: (i, node) => {
                return 0;
              },
              hLineColor: (i, node) => {
                return i === 0 || i === 1 || i === 3 || i === 4 || i === 5 ? 'black' : 'gray';
              },
              vLineColor: (i, node) => {
                return 'blacl';
              },
            },
          },
        ],
      ],
    },
  ];
  return content;
}
