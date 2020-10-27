import * as fun_ from './utils/funciones';
import { logoADM } from './utils/files';

// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================

export function makeCuadre(data) {
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
      letra14: {
        fontSize: 14,
      },
      letra17: {
        fontSize: 17,
      },
    },
  };

  const obj = {
    doc: dd,
    file: 'conduce.pdf',
  };
  return obj;
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
                fontSize: 17,
              },
              {
                text: 'Autopista Duarte Km0 El Higuero, La Vega',
                alignment: 'center',
                fontSize: 11,
              },
              {
                text: [
                  { text: 'Telefono: ', fontSize: 9, bold: true },
                  { text: '809-572-0060 ', fontSize: 9 },
                  { text: ' RNC: ', fontSize: 9, bold: true },
                  { text: '131-99603-5', fontSize: 9 },
                ],
                alignment: 'center',
              },
            ],
          },
        ],
        [
          {
            text: [{ text: '27/10/2020', fontSize: 14, bold: true }],
            margin: [0, 25, 20, 0],
            alignment: 'right',
          },
          {
            text: [
              {
                text: [{ text: 'no: ', fontSize: 11, bold: false }],
                margin: [0, 5, 20, 0],
                alignment: 'right',
              },
              { text: fun_.my_padStart(data.numero_reporte, 8, '0'), style: 'letra11' },
            ],
          },
          {
            text: [
              {
                text: [{ text: 'realizado por: ', fontSize: 11, bold: false }],
                margin: [0, 5, 20, 0],
                alignment: 'right',
              },
              { text: fun_.my_capitalize(data.user.nombre) + ' ' + fun_.my_capitalize(data.user.apellido), style: 'letra11' },
            ],
          },
        ],
      ],
    },
    {
      text: [{ text: 'Cuadre de caja', fontSize: 17, bold: true }],
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
                    fontSize: 17,
                  },
                  {
                    text: 'Monto',
                    alignment: 'right',
                    bold: true,
                    fontSize: 17,
                  },
                ],
                [
                  {
                    text: 'Total facturado a contado:',
                    alignment: 'left',
                    bold: true,
                    fontSize: 15,
                  },
                  {
                    margin: [0, 3, 0, 0],
                    text: '723,747.34',
                    alignment: 'right',
                    fontSize: 13,
                  },
                ],
                [
                  {
                    text: 'Total recibo de ingreso:',
                    alignment: 'left',
                    bold: true,
                    fontSize: 15,
                  },
                  {
                    margin: [0, 3, 0, 0],
                    text: '55,321.72',
                    alignment: 'right',
                    fontSize: 13,
                  },
                ],
                [
                  {
                    text: 'Total en caja:',
                    alignment: 'left',
                    bold: true,
                    fontSize: 15,
                  },
                  {
                    margin: [0, 3, 0, 0],
                    text: '779,069.06',
                    alignment: 'right',
                    fontSize: 14,
                    bold: true,
                  },
                ],
                [
                  {
                    margin: [0, 17, 0, 0],
                    text: 'Total facturado a crédito:',
                    alignment: 'left',
                    fontSize: 16,
                  },
                  {
                    margin: [0, 20, 0, 0],
                    text: '0.00',
                    alignment: 'right',
                    fontSize: 13,
                  },
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
