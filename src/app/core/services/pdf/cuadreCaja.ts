/* eslint-disable @typescript-eslint/indent */
import * as fun_ from './utils/funciones';
import { styles_ } from './utils/files';
import { SingletonService } from '../singleton.service';
import { ConfigI } from '../../typescript/config-interface';

// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================

export function makeCuadre(data) {
  const configApp: ConfigI = SingletonService.configServ.getConfig({ isPromise: false });
  try {
    const dd = {
      pageSize: { width: 990, height: 398 },
      pageMargins: [0, 159.5, 0, 30],
      header: cabeceraReporte(data, configApp),
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
        logo: `data:image/png;base64,${configApp.logo_impresion}`,
      },
      styles: styles_,
    };

    const obj = { doc: dd, file: 'cuadre.pdf', type: 'base64' };
    return obj;
  } catch (error) {
    return error;
  }
}

// ====================================================================================================================================================
// CABECERA
// ====================================================================================================================================================
function cabeceraReporte(data, configApp: ConfigI) {
  try {
    const header = [
      {
        columns: [
          [
            {
              image: 'logo',
              width: 72,
              height: 45,
              margin: [90, 12, 0, 0],
            },
          ],
          [
            {
              margin: [0, 23, 0, 0],
              stack: [
                {
                  text: configApp.nombre_empresa,
                  alignment: 'center',
                  bold: true,
                  style: 'letra17',
                },
                {
                  text: configApp.direccion_empresa,
                  alignment: 'center',
                  fontSize: 11,
                },
                {
                  text: [
                    { text: 'Telefono: ', style: 'letra11', bold: true },
                    { text: configApp.telefono_empresa + ' ', style: 'letra11' },
                    { text: ' RNC: ', style: 'letra11', bold: true },
                    { text: configApp.rnc_empresa, style: 'letra11' },
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
                      text: [{ text: 'no: ', fontSize: 13, bold: false }],
                      alignment: 'right',
                    },
                    { text: fun_.my_padStart(data.numero_reporte, 8, '0'), fontSize: 13, alignment: 'right' },
                  ],
                },
                {
                  alignment: 'right',
                  text: [
                    {
                      text: [{ text: 'Realizado por: ', fontSize: 13, bold: false }],
                      alignment: 'right',
                    },
                    { text: data.usuario, fontSize: 13, alignment: 'right' },
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
            x: 395,
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
  } catch (error) {
    throw error;
  }
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
                    margin: [0, 0, 20, 0],
                  },
                ],
                [
                  {
                    text: 'Total facturado a contado:',
                    alignment: 'left',
                    bold: true,
                    style: 'letra15',
                  },
                  { text: fun_.numFormatTwoDecimals(data.total_venta_contado), fontSize: 13, alignment: 'right', margin: [0, 3, 20, 0] },
                ],
                [
                  {
                    text: 'Total recibo de ingreso:',
                    alignment: 'left',
                    bold: true,
                    style: 'letra15',
                  },
                  { text: fun_.numFormatTwoDecimals(data.total_recibo_ingreso), fontSize: 13, alignment: 'right', margin: [0, 3, 20, 0] },
                ],
                [
                  {
                    text: 'Total en caja:',
                    alignment: 'left',
                    bold: true,
                    style: 'letra15',
                  },
                  { text: fun_.numFormatTwoDecimals(data.total_general), fontSize: 13, alignment: 'right', margin: [0, 3, 20, 0] },
                ],
                [
                  {
                    margin: [0, 17, 0, 0],
                    text: 'Total facturado a crédito:',
                    alignment: 'left',
                    fontSize: 16,
                  },
                  { text: fun_.numFormatTwoDecimals(data.total_venta_credito), fontSize: 13, alignment: 'right', margin: [0, 19, 20, 0] },
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
