import * as numLetra from './utils/numero_letras';
import * as fun_ from './utils/funciones';
import { logoADM, styles_ } from './utils/files';
import { AppConfig } from '../src/environments/environment.js';

// ==========================================================================================================================================================
// UNIR REPORTE
// ==========================================================================================================================================================

export function makeRecibo(data) {
  const dd = {
    // pageSize: { width: 990, height: 398 },
    pageMargins: [0, 111, 0, 30],
    header: cabeceraReporte(data),
    content: contenidoReporte(data),
    footer: (currentPage, pageCount) => {
      return [
        {
          text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
          alignment: 'right',
          style: 'letra11',
          margin: [0, 0, 30, 0],
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
function cabeceraReporte(data) {
  const header = [
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
              { text: 'Fecha: ', style: 'letra10', bold: true },
              { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra10' },
              { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra10' },
            ],
            alignment: 'right',
            margin: [0, 19, 20, 0],
          },
        ],
      ],
    },
    {
      text: [{ text: data.titulo_reporte, style: 'letra12', bold: true }],
      margin: [0, 15, 0, 0],
      alignment: 'center',
    },

    {
      canvas: [{ type: 'rect', x: 10, y: 20, w: 575, h: 1, color: '#000000' }],
    },
  ];

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================

function contenidoReporte(data) {
  const tempBody = [];

  const titulos = [];

  tabla_config[data.tipo_reporte].info.forEach((titulo, i) => {
    titulos.push({
      text: titulo.text,
      alignment: titulo.alignment,
      style: titulo.style,
      bold: true,
      margin: titulo.margin_titulo ? titulo.margin_titulo : [0, 0, 0, 0],
    });
  });

  data.detalle_recibos.forEach((detalle, i) => {
    const row = [];
    const tipo = fun_.my_stringSplit(detalle.descripcion, ' ')[0];
    const valor = fun_.my_stringSplit(detalle.descripcion, ' ')[1];
    const fecha = fun_.my_stringSplit(detalle.descripcion, ' ')[2];

    const br_ = i !== 0 && i % 6 === 0;

    row.push(
      { text: i + 1, alignment: 'center', pageBreak: br_ ? 'before' : 'none' },
      { text: fun_.my_dateFormater(fecha), pageBreak: br_ ? 'before' : 'none', alignment: 'center' },
      { text: valor, pageBreak: br_ ? 'before' : 'none', alignment: 'center' },
      { text: fun_.numFormatTwoDecimals(detalle.total_factura), alignment: 'right', pageBreak: br_ ? 'before' : 'none', margin: [0, 0, 0, 0] },
      { text: fun_.numFormatTwoDecimals(detalle.balance_anterior_factura), alignment: 'right', pageBreak: br_ ? 'before' : 'none', margin: [0, 0, 0, 0] },
      { text: fun_.numFormatTwoDecimals(detalle.deposito), pageBreak: br_ ? 'before' : 'none', alignment: 'right' },
      { text: fun_.numFormatTwoDecimals(detalle.balance_factura), alignment: 'right', pageBreak: br_ ? 'before' : 'none', margin: [0, 0, 20, 0] },
    );
    tempBody.push(row);
  });

  var content_ = [
    {
      table: {
        headerRows: 1,
        widths: tabla_config[data.tipo_reporte].widths,
        body: [
          titulos,
          [
            {
              text: 1,
              alignment: 'center',
              margin: [0, 0, 5, 0],
              style: 'letra10',
            },
            { text: '08/12/2019', margin: [0, 0, 0, 0], style: 'letra10' },
            { text: 'B0100000001', margin: [0, 0, 0, 0], style: 'letra10' },
            { text: 'Cliente contado', margin: [0, 0, 0, 0], style: 'letra10' },
            { text: '0.00', margin: [0, 0, 20, 0], alignment: 'right', style: 'letra10' },
            { text: '100,000.00', margin: [0, 0, 0, 0], alignment: 'right', style: 'letra10' },
          ],
        ],
      },
      margin: [10, 0, 10, 0],
      layout: {
        hLineWidth: function (i, node) {
          return i % 41 === 0 && node.table.body.length !== 41 ? 0 : i === node.table.body.length || i === 1 ? 1.5 : 1;
        },
        vLineWidth: function (i, node) {
          return 0;
        },
        hLineColor: function (i, node) {
          return i === node.table.body.length || i === 1 ? 'black' : 'gray';
        },
        vLineColor: function (i, node) {
          return 'blacl';
        },
      },
    },
    {
      text: [
        { text: 'Realizada Por:  ', style: 'letra10', bold: true },
        { text: 'Usuario', style: 'letra10' },
      ],
      margin: [15, 5, 0, 0],
    },
    {
      stack: [
        {
          margin: [0, -14, 35, 0],
          columns: [
            [],
            [
              {
                table: {
                  widths: ['*'],
                  body: [
                    [
                      {
                        alignment: 'right',
                        text: [
                          {
                            text: 'TOTAL RD$:         ',
                            style: 'letra10',
                            bold: true,
                          },
                          {
                            text: '100,000.00',
                            style: 'letra10',
                            bold: true,
                          },
                        ],
                      },
                    ],
                  ],
                },
                layout: 'noBorders',
              },
            ],
          ],
        },
      ],
      unbreakable: true,
    },
  ];

  const content = [
    {
      margin: [10, 0, 10, 0],
      table: {
        widths: [24, '*', '*', '*', '*', '*', '*'],
        body: tempBody,
      },

      layout: {
        hLineWidth: (i, node) => {
          return i % 6 === 0 && node.table.body.length !== 6 ? 0 : i === node.table.body.length ? 2 : 1;
        },
        vLineWidth: (i, node) => {
          return 0;
        },
        hLineColor: (i, node) => {
          return i === node.table.body.length ? 'black' : 'gray';
        },
        vLineColor: (i, node) => {
          return 'black';
        },
      },
    },
    {
      text: [
        { text: 'Realizado Por :  ', style: 'letra11', bold: true },
        { text: fun_.my_capitalize(data.user.nombre) + ' ' + fun_.my_capitalize(data.user.apellido), style: 'letra11' },
      ],

      margin: [20, 5, 0, 0],
    },
    {
      stack: [
        {
          margin: [10, 30, 0, 0],
          columns: [
            [
              {
                stack: [
                  {
                    margin: [0, 0, 0, 0],
                    canvas: [
                      { type: 'rect', x: 0, y: 0, w: 140, h: 1, color: '#000000' },
                      { type: 'rect', x: 215, y: 0, w: 140, h: 1, color: '#000000' },
                    ],
                  },
                  {
                    columns: [
                      [
                        {
                          text: [{ text: 'Recibido Por', fontSize: 12, bold: true }],
                          margin: [35, 5, 0, 0],
                        },
                      ],
                      [
                        {
                          text: [{ text: 'Entregado Por', fontSize: 12, bold: true }],
                          margin: [5, 5, 0, 0],
                        },
                      ],
                    ],
                  },
                ],
              },
            ],
            [
              {
                table: {
                  widths: ['*'],
                  body: [
                    [
                      {
                        margin: [0, 0, data.detalle_recibos.length <= 6 ? 25 : 45, 0],
                        alignment: 'right',
                        text: [
                          {
                            text: 'TOTAL RD$:         ',
                            bold: true,
                          },
                          { text: fun_.numFormatTwoDecimals(data.total), fontSize: 12 },
                        ],
                      },
                    ],
                  ],
                },
                layout: 'noBorders',
              },
            ],
          ],
        },
      ],
      unbreakable: true,
    },
  ];

  return content;
}

const tabla_config = {
  ventas: {
    widths: [24, 70, 80, '*', 'auto', 'auto'],
    info: [
      {
        text: '#',
        alignment: 'center',
        style: 'letra10',
      },
      {
        text: 'Fecha',
        alignment: 'left',
        style: 'letra10',
      },
      {
        text: 'Factura',
        style: 'letra10',
        alignment: 'left',
      },
      {
        text: 'Cliente',
        style: 'letra10',
        alignment: 'left',
      },
      {
        text: 'Descuento',
        style: 'letra10',
        alignment: 'left',
        margin_titulo: [0, 0, 20, 0],
      },
      {
        text: 'Total Venta',
        style: 'letra10',
        alignment: 'left',
      },
    ],
  },
};
