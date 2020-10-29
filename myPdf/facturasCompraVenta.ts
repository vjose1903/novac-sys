import * as fun_ from './utils/funciones';
import { logoADM } from './utils/files';
import { AppConfig } from '../src/environments/environment.js';
// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================
function getPageMargin(data) {
  let margins = [];

  if (data.FACTURA_DE === 'venta') {
    if (data.condicion === 'Contado') {
      margins = [10, 152, 5, 30];
    } else {
      margins = [10, 162, 5, 30];
    }
  } else {
    if (data.condicion === 'Contado') {
      margins = [10, 153, 5, 30];
    } else {
      margins = [10, 165, 5, 30];
    }
  }

  return margins;
}

export function makeFacturaVenta(data) {
  const dd = {
    pageSize: { width: 816, height: 528 },
    pageMargins: getPageMargin(data),
    header: cabeceraFacturaVenta(data),
    content: contenidoFacturaVenta(data),
    footer: (currentPage, pageCount) => {
      return [
        {
          text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
          alignment: 'right',
          margin: [0, 0, 30, 0],
        },
        data.FACTURA_DE === 'venta'
          ? data.condicion === 'Contado'
            ? { text: '' }
            : {
                text: 'Después de la fecha de vencimiento de la factura, se generará un 2% de recargo',
                alignment: 'center',
                margin: [0, -10, 0, 0],
              }
          : { text: '' },
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
    file: 'factura.pdf',
    type: 'file',
  };
  console.log('/////////// ', obj);

  return obj;
}

// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraFacturaVenta(data) {
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
          data.FACTURA_DE === 'nota'
            ? { text: '' }
            : {
                text: 'FACTURA A ' + data.condicion.toUpperCase(),
                alignment: 'right',
                bold: true,
                style: 'letra14',
                margin: [0, 20, 30],
              },
          //
        ],
      ],
    },
    {
      margin: [0, -62, 0, 0],
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
        },
        {
          text: [
            { text: 'Telefono: ', style: 'letra10' },
            { text: AppConfig.num_telefono + ' ', style: 'letra10' },
            { text: ' RNC: ', bold: true, style: 'letra10' },
            { text: AppConfig.rnc, style: 'letra10' },
          ],
          alignment: 'center',
        },
      ],
    },

    {
      margin: [15, 15, 0, 0],
      columns: [
        [
          {
            text: [
              data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: 'Cliente : ', style: 'letra12' } : { text: 'Suplidor : ', style: 'letra12' },
              data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.nombre, style: 'letra12' } : { text: data.suplidor.nombre, style: 'letra12' },
            ],
            margin: [0, 0, 0, 0],
          },
          {
            text: [
              data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: 'Rnc cliente : ', style: 'letra12' } : { text: 'Rnc suplidor : ', style: 'letra12' },
              data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.rnc, style: 'letra12' } : { text: data.suplidor.rnc, style: 'letra12' },
            ],
            margin: [0, 5, 0, 0],
          },
          {
            text: [
              { text: 'Dirección : ', style: 'letra12' },
              data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.direccion, style: 'letra12' } : { text: data.suplidor.direccion, style: 'letra12' },
            ],
            margin: [0, 5, 0, 0],
          },
        ],
        [
          {
            text: [{ text: data.tipo_factura, style: 'letra14' }],
            margin: [0, 15, 0, 0],
            alignment: 'center',
          },

          data.FACTURA_DE === 'compra'
            ? {
                text: [{ text: '- - - COMPRA - - -', style: 'letra11' }],
                margin: [0, 1, 0, 0],
                alignment: 'center',
              }
            : { text: '' },

          data.FACTURA_DE === 'nota'
            ? {
                text: [
                  { text: 'Aplicada a: ', style: 'letra11' },
                  { text: data.aplicada_a, style: 'letra11' },
                ],
                margin: [0, 1, 0, 0],
                alignment: 'center',
              }
            : { text: '' },
        ],
        [
          {
            stack: [
              {
                text: [
                  { text: 'Fecha : ', style: 'letra11' },
                  { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra11' },
                  { text: ' - ' + fun_.my_houreFormater(data.fecha_equivalente), style: 'letra11' },
                ],
                margin: [85, -10, 0, 0],
              },
              (data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' || data.FACTURA_DE === 'compra') && data.condicion === 'Contado'
                ? { text: '' }
                : {
                    text: [
                      { text: 'Fecha vencimiento : ', style: 'letra11' },
                      { text: fun_.my_dateFormater(data.fecha_vencimiento), style: 'letra11' },
                    ],
                    margin: [85, 3, 0, 0],
                  },
              {
                text: [
                  { text: 'NCF : ', style: 'letra11' },
                  { text: data.numero_comprobante, style: 'letra11' },
                ],
                margin: [85, 3, 0, 0],
              },
              {
                text: [
                  { text: 'Doc No : ', style: 'letra11' },
                  { text: fun_.my_padStart(data.numero_factura, 8, '0'), style: 'letra11' },
                ],
                margin: [85, 3, 0, 0],
              },
              {
                text: [
                  { text: 'Valida hasta : ', style: 'letra11' },
                  data.tipo_factura_id === 3
                    ? { text: 'No aplica.', style: 'letra11' }
                    : data.FACTURA_DE === 'compra'
                    ? { text: ' ' }
                    : { text: fun_.my_dateFormater(data.fecha_valida), style: 'letra11' },
                ],
                margin: [85, 3, 0, 0],
              },
            ],
            margin: data.condicion === 'Contado' ? [-10, 0, 0, 0] : [-10, -5, 0, 0],
          },
        ],
      ],
    },

    // =============================================================
    {
      canvas: [
        {
          type: 'rect',
          x: 10,
          y: 3,
          w: 790,
          h: 2,
          color: '#000000',
        },
      ],
    },

    {
      style: 'tableExample',
      table: {
        headerRows: 1,
        widths: [30, 245, '*', '*', '*', '*', '*'],
        body: [
          [
            { text: ' #', bold: true, margin: [4, 0, 0, 0] },
            { text: 'Articulo', bold: true, margin: [-10, 0, 0, 0] },
            { text: 'Cantidad', bold: true, alignment: 'right', margin: [0, 0, 5, 0] },
            { text: 'Unidad', bold: true, alignment: 'center', margin: [0, 0, 15, 0] },
            data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota'
              ? { text: 'Precio', bold: true, alignment: 'right', margin: [0, 0, 17, 0] }
              : { text: 'Costo', bold: true, alignment: 'right', margin: [0, 0, 18, 0] },
            { text: 'Itbis', bold: true, alignment: 'right', margin: [0, 0, 17, 0] },
            { text: 'Total', bold: true, alignment: 'right', margin: [0, 0, 18, 0] }, // margin: [12, 0, 0, 0]
          ],

          [1, 'Sample value 1', 'value 2', 'value 3', 'value 4', 'value 5', 'value 6'],
        ],
      },
      margin: [10, 0, 15, 0],
      layout: 'headerLineOnly',
    },
  ];
  console.log('////////////////// header', header);

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================
function calcularPrecio(cant, precio, tipo) {
  const res = cant * precio;
  return fun_.redondearAdos(res);
}

function contenidoFacturaVenta(data) {
  const tempBody = [];
  data.detalle_facturas.forEach((detalle, i) => {
    const row = [];

    const br_ = i !== 0 && i % 10 === 0;

    row.push(
      { text: i + 1, pageBreak: br_ ? 'before' : 'none' },
      { text: detalle.descripcion, pageBreak: br_ ? 'before' : 'none' },
      { text: fun_.numFormatTwoDecimals(detalle.cantidad), alignment: 'right', margin: [0, 0, 15, 0], pageBreak: br_ ? 'before' : 'none' },
      { text: detalle.unidad, alignment: 'center', pageBreak: br_ ? 'before' : 'none' },
      {
        text: fun_.numFormatTwoDecimals(data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? detalle.precio : detalle.costo),
        alignment: 'right',
        margin: [0, 0, 14, 0],
        pageBreak: br_ ? 'before' : 'none',
      },
      { text: fun_.numFormatTwoDecimals(detalle.itbis), alignment: 'right', margin: [0, 0, 15, 0], pageBreak: br_ ? 'before' : 'none' },
      { text: fun_.numFormatTwoDecimals(detalle.total), alignment: 'right', margin: [0, 0, 15, 0], pageBreak: br_ ? 'before' : 'none' },
    );
    tempBody.push(row);
  });
  const content = [
    {
      style: 'tableExample',
      table: {
        widths: [30, 245, '*', '*', '*', '*', '*'],
        body: tempBody,
      },
      margin: data.condicion === 'Contado' ? [0, -2, 10, 0] : [0, -2, 10, 0],
      layout: {
        hLineWidth: (i, node) => {
          return i % 10 === 0 && node.table.body.length !== i ? 0 : i === node.table.body.length ? 2 : 1;
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
        { text: 'Realizada Por :  ', style: 'letra11', bold: true },
        { text: data.usuario, style: 'letra11' },
        data.vendedor ? { text: '    Vendedor :  ', style: 'letra11', bold: true } : { text: '' },
        data.vendedor ? { text: data.vendedor, style: 'letra11' } : { text: '' },
      ],
      margin: [0, 5, 0, 0],
    },
    // -----------------------
    {
      stack: [
        {
          columns: [
            [
              {
                stack: [
                  {
                    canvas: [
                      {
                        type: 'rect',
                        x: 10,
                        y: 0,
                        w: 140,
                        h: 1,
                        color: '#000000',
                      },
                      {
                        type: 'rect',
                        x: 200,
                        y: 0,
                        w: 140,
                        h: 1,
                        color: '#000000',
                      },
                    ],
                    margin: [0, 80, 0, 0],
                  },
                  {
                    columns: [
                      [
                        {
                          text: [{ text: 'Revisada Por', style: 'letra12', bold: true }],
                          margin: [45, 5, 0, 0],
                        },
                      ],
                      [
                        {
                          text: [{ text: 'Cliente', style: 'letra12', bold: true }],
                          margin: [45, 5, 0, 0],
                        },
                      ],
                    ],
                  },
                ],
                margin: [0, -40, 0, 0],
              },
            ],
            [
              {
                margin: [0, -12, 0, 0],
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: 'Bruto RD$: ', style: 'letra11', bold: true, alignment: 'right' },
                      { text: fun_.numFormatTwoDecimals(data.Bruto), style: 'letra11', alignment: 'right', margin: [0, 0, 40, 0] },
                    ],
                    [
                      { text: 'Itbis RD$: ', style: 'letra11', bold: true, alignment: 'right' },
                      { text: fun_.numFormatTwoDecimals(data.itbis), style: 'letra11', alignment: 'right', margin: [0, 0, 40, 0] },
                    ],
                    [
                      { text: 'Descuento RD$: ', style: 'letra11', bold: true, alignment: 'right' },
                      { text: fun_.numFormatTwoDecimals(data.descuento), style: 'letra11', alignment: 'right', margin: [0, 0, 40, 0] },
                    ],
                    [
                      { text: 'TOTAL RD$: ', style: 'letra11', bold: true, alignment: 'right' },
                      { text: fun_.numFormatTwoDecimals(data.total_factura), style: 'letra11', alignment: 'right', margin: [0, 0, 40, 0] },
                    ],
                    data.FACTURA_DE === 'compra' || data.FACTURA_DE === 'nota'
                      ? [{ text: '' }, { text: '' }]
                      : [
                          { text: 'Devuelta RD$: ', style: 'letra11', bold: true, alignment: 'right' },
                          { text: fun_.numFormatTwoDecimals(data.devuelta), style: 'letra11', alignment: 'right', margin: [0, 0, 40, 0] },
                        ],
                  ],
                },
                layout: 'noBorders',
                // margin: [585, 3, 0, 0],
              },
            ],
          ],
        },
      ],
      unbreakable: true,
    },
    // -----------------------
  ];
  console.log('////////////////// content', content);
  return content;
}
