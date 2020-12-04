import * as fun_ from './utils/funciones';
import { logoADM, styles_ } from './utils/files';
import { AppConfig } from '../src/environments/environment.js';

// ==========================================================================================================================================================
// UNIR REPORTE
// ==========================================================================================================================================================

export function makeReporte(data) {
  const dd = {
    // pageSize: { width: 990, height: 398 },
    pageMargins: [0, data.mostrar_sub_titulo ? 116 : 108, 0, 30],
    header: cabeceraReporte(data),
    content: contenidoReporte(data),
    footer: (currentPage, pageCount) => {
      return [
        {
          text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
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
              { text: data.fecha, style: 'letra10' },
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
    data.mostrar_sub_titulo
      ? {
          text: data.sub_titulo,
          style: 'letra10',
          margin: [15, 10, 0, 0],
        }
      : { text: '' },
    {
      canvas: [{ type: 'rect', x: 10, y: data.mostrar_sub_titulo ? 5 : 20, w: 575, h: 1.5, color: '#000000' }],
    },
  ];
  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================

function contenidoReporte(data) {
  const titulos = [];
  const body = [];

  t_c[data.tipo_reporte].info.forEach((titulo, i) => {
    titulos.push({
      text: titulo.text,
      alignment: titulo.alignment_titulo,
      style: titulo.style,
      bold: true,
      margin: titulo.margin_titulo ? titulo.margin_titulo : [0, 0, 0, 0],
    });
  });
  body.push(titulos);

  data.contenido_reporte.forEach((detalle, j) => {
    const row = [];
    const br_ = j !== 0 && j % t_c[data.tipo_reporte].break === 0;

    t_c[data.tipo_reporte].info.forEach((info, i) => {
      let obj = {};
      let text_ = '';

      if (info.key === 'index') {
        text_ = j + 1;
      } else {
        if (info.formato_fecha) {
          text_ = fun_.my_dateFormater(detalle[info.key]);
        } else if (info.formato_numero) {
          text_ = fun_.numFormatTwoDecimals(detalle[info.key]);
        } else {
          text_ = detalle[info.key];
        }
      }
      obj = {
        text: text_,
        alignment: info.alignment_body,
        margin: info.margin_body ? info.margin_body : [0, 0, 0, 0],
        style: info.style_body,
        pageBreak: br_ ? 'before' : 'none',
      };

      row.push(obj);
    });

    body.push(row);
  });

  var content = [
    {
      table: {
        headerRows: 1,
        widths: t_c[data.tipo_reporte].widths,
        body: body,
      },
      margin: t_c[data.tipo_reporte].margin_general,
      layout: {
        hLineWidth: function (i, node) {
          return i % t_c[data.tipo_reporte].break === 0 && node.table.body.length !== t_c[data.tipo_reporte].break
            ? 0
            : i === node.table.body.length || i === 1
            ? 1.5
            : 1;
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
        { text: 'Realizado Por:  ', style: 'letra10', bold: true },
        { text: data.realizado_por, style: 'letra10' },
      ],
      margin: [15, 5, 0, 0],
    },
    data.mostrar_total
      ? {
          stack: [
            {
              margin: [0, -14, data.contenido_reporte.length <= t_c[data.tipo_reporte].break ? 24 : 35, 0],
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
                                text: fun_.numFormatTwoDecimals(data.total),
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
        }
      : { text: '' },
  ];

  // const content = [
  //   {
  //     margin: [10, 0, 10, 0],
  //     table: {
  //       widths: [24, '*', '*', '*', '*', '*', '*'],
  //       body: tempBody,
  //     },

  //     layout: {
  //       hLineWidth: (i, node) => {
  //         return i % 6 === 0 && node.table.body.length !== 6 ? 0 : i === node.table.body.length ? 2 : 1;
  //       },
  //       vLineWidth: (i, node) => {
  //         return 0;
  //       },
  //       hLineColor: (i, node) => {
  //         return i === node.table.body.length ? 'black' : 'gray';
  //       },
  //       vLineColor: (i, node) => {
  //         return 'black';
  //       },
  //     },
  //   },
  //   {
  //     text: [
  //       { text: 'Realizado Por :  ', style: 'letra11', bold: true },
  //       { text: fun_.my_capitalize(data.user.nombre) + ' ' + fun_.my_capitalize(data.user.apellido), style: 'letra11' },
  //     ],

  //     margin: [20, 5, 0, 0],
  //   },
  //   {
  //     stack: [
  //       {
  //         margin: [10, 30, 0, 0],
  //         columns: [
  //           [
  //             {
  //               stack: [
  //                 {
  //                   margin: [0, 0, 0, 0],
  //                   canvas: [
  //                     { type: 'rect', x: 0, y: 0, w: 140, h: 1, color: '#000000' },
  //                     { type: 'rect', x: 215, y: 0, w: 140, h: 1, color: '#000000' },
  //                   ],
  //                 },
  //                 {
  //                   columns: [
  //                     [
  //                       {
  //                         text: [{ text: 'Recibido Por', fontSize: 12, bold: true }],
  //                         margin: [35, 5, 0, 0],
  //                       },
  //                     ],
  //                     [
  //                       {
  //                         text: [{ text: 'Entregado Por', fontSize: 12, bold: true }],
  //                         margin: [5, 5, 0, 0],
  //                       },
  //                     ],
  //                   ],
  //                 },
  //               ],
  //             },
  //           ],
  //           [
  //             {
  //               table: {
  //                 widths: ['*'],
  //                 body: [
  //                   [
  //                     {
  //                       margin: [0, 0, data.detalle_recibos.length <= 6 ? 25 : 45, 0],
  //                       alignment: 'right',
  //                       text: [
  //                         {
  //                           text: 'TOTAL RD$:         ',
  //                           bold: true,
  //                         },
  //                         { text: fun_.numFormatTwoDecimals(data.total), fontSize: 12 },
  //                       ],
  //                     },
  //                   ],
  //                 ],
  //               },
  //               layout: 'noBorders',
  //             },
  //           ],
  //         ],
  //       },
  //     ],
  //     unbreakable: true,
  //   },
  // ];
  return content;
}

const t_c = {
  ventas: {
    margin_general: [10, 0, 10, 0],
    break: 41,
    widths: [24, 70, 80, '*', 'auto', 'auto'],
    info: [
      {
        text: '#',
        alignment_titulo: 'center',
        style: 'letra10',
        style_body: 'letra10',
        key: 'index',
        alignment_body: 'center',
      },
      {
        text: 'Fecha',
        alignment_titulo: 'left',
        style: 'letra10',
        style_body: 'letra10',
        key: 'fecha_equivalente',
        alignment_body: 'left',
        formato_fecha: true,
      },
      {
        text: 'Factura',
        style: 'letra10',
        alignment_titulo: 'left',
        style_body: 'letra10',
        key: 'numero_comprobante',
        alignment_body: 'left',
      },
      {
        text: 'Cliente',
        alignment_titulo: 'left',
        style: 'letra10',
        style_body: 'letra10',
        key: 'cliente_nombre',
        alignment_body: 'left',
      },
      {
        text: 'Descuento',
        alignment_titulo: 'right',
        margin_titulo: [0, 0, 20, 0],
        margin_body: [0, 0, 20, 0],
        style: 'letra10',
        style_body: 'letra10',
        key: 'descuento',
        alignment_body: 'right',
        formato_numero: true,
      },
      {
        text: 'Total Venta',
        margin_titulo: [0, 0, 10, 0],
        margin_body: [0, 0, 10, 0],
        alignment_titulo: 'right',
        style: 'letra10',
        style_body: 'letra10',
        key: 'total_factura',
        alignment_body: 'right',
        formato_numero: true,
      },
    ],
  },
};
