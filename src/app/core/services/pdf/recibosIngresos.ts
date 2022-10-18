/* eslint-disable @typescript-eslint/indent */
import * as numLetra from './utils/numero_letras';
import * as fun_ from './utils/funciones';
import { styles_ } from './utils/files';
import { SingletonService } from '../singleton.service';
import { ConfigI } from '../../typescript/config-interface';

// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================

export function makePDF(data, file_name, tipo_pdf?) {
  const configApp: ConfigI = SingletonService.configServ.getConfig({ isPromise: false });
  const dd = {
    pageSize: { width: 600, height: 398 },
    pageMargins: [15, 159.5, 15, 15],
    header: (currentPage, pageCount, pageSize) => cabeceraRecibo(data, configApp, currentPage, pageCount),
    content: contenidoRecibo(data),

    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
    },
    styles: styles_,
  };

  const obj = { doc: dd, file: file_name, type: 'file' };
  return obj;
}

// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraRecibo(data, configApp: ConfigI, currentPage, pageCount) {
  const rncCliente = data.cliente.documentos_de_identidad.filter((doc) => doc.principal === true)[0].documento;
  const numero_letra = numLetra.NumeroALetras(data.total);

  const header = [
    {
      margin: [15, 15, 15, 0],
      columns: [
        [
          { text: 'pag: ' + currentPage.toString() + ' de ' + pageCount, alignment: 'left', style: 'letra9' },
          { image: 'logo', width: 50, height: 45, margin: [70, -15, 0, 0] },
        ],
        [
          { text: 'Recibo de ingresos', style: 'letra12', bold: true, margin: [0, 20, 65, 0], alignment: 'right' },
          {
            text: [
              { text: 'Fecha: ', style: 'letra10', bold: true },
              { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra10' },
              { text: ' - ' + fun_.my_houreFormater(data.fecha_equivalente), style: 'letra10' },
            ],
            margin: [310, 10, 0, 0],
          },

          {
            text: [
              { text: 'Doc No: ', style: 'letra10', bold: true },
              { text: fun_.my_padStart(data.numero_documento, 8, '0'), style: 'letra10' },
            ],
            margin: [310, 3, 0, 0],
          },
        ],
      ],
    },
    {
      margin: [0, -60, 0, 0],
      stack: [
        {
          text: configApp.nombre_empresa,
          alignment: 'center',
          bold: true,
          fontSize: 17,
        },
        {
          text: configApp.direccion_empresa,
          alignment: 'center',
        },
        {
          text: [
            { text: 'Telefono: ', style: 'letra11', bold: true },
            { text: configApp.telefono_empresa + ' ', style: 'letra11' },
            { text: ' RNC: ', bold: true, style: 'letra11' },
            { text: configApp.rnc_empresa, style: 'letra11' },
          ],
          alignment: 'center',
        },
      ],
    },
    {
      margin: [15, 5, 0, 0],
      text: [{ text: 'Cliente: ', style: 'letra12', bold: true }, { text: `${fun_.my_capitalize(data.cliente.nombre)} ${fun_.my_capitalize(data.cliente.apellido)}` }],
    },

    {
      text: [{ text: 'Rnc cliente: ', style: 'letra12', bold: true }, { text: rncCliente }],
      margin: [15, 3, 0, 0],
    },
    {
      text: [{ text: 'Dirección: ', style: 'letra12', bold: true }, { text: data.cliente.direccion }],
      margin: [15, 3, 0, 0],
    },

    {
      text: [{ text: 'Recibido: ', style: 'letra12', bold: true }, { text: fun_.numFormatTwoDecimals(data.total) }, { text: ` - ${fun_.my_capitalize(numero_letra)}` }],
      margin: [15, 3, 0, 0],
    },
    { canvas: [{ type: 'rect', x: 10, y: 5, w: 970, h: 2, color: '#000000' }] },
    {
      margin: [10, 0, 10, 0],
      table: {
        headerRows: 1,
        widths: [24, '*', '*', '*', '*', '*', '*'],
        body: [
          [
            {
              text: '#',
              style: 'tableHeader',
              alignment: 'center',
              bold: true,
              margin: [4, 0, 0, 0],
            },
            {
              text: 'Fecha',
              style: 'tableHeader',
              bold: true,
              alignment: 'center',
              margin: [0, 0, 0, 0],
            },
            {
              text: 'Factura',
              style: 'tableHeader',
              bold: true,
              alignment: 'center',
              margin: [0, 0, 0, 0],
            },
            {
              text: 'Monto facturado',
              style: 'tableHeader',
              bold: true,
              alignment: 'right',
              margin: [0, 0, 0, 0],
            },
            {
              text: 'Balance anterior',
              style: 'tableHeader',
              bold: true,
              alignment: 'right',
              margin: [0, 0, 0, 0],
            },
            {
              text: 'Monto recibido',
              style: 'tableHeader',
              bold: true,
              alignment: 'right',
              margin: [0, 0, 0, 0],
            },
            {
              text: 'Balance actual',
              style: 'tableHeader',
              bold: true,
              alignment: 'right',
              margin: [0, 0, 20, 0],
            },
          ],
          [1, 'Sample value 1', 'value 2', 'value 2', 'value 2', 'value 2', 'value 2'],
        ],
      },
      layout: 'headerLineOnly',
    },
  ];

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// ==========================================================================================================================================================

function contenidoRecibo(data) {
  const tempBody = [];
  data.contenido_reporte.forEach((detalle, i) => {
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
      {
        text: fun_.numFormatTwoDecimals(detalle.balance_anterior_factura),
        alignment: 'right',
        pageBreak: br_ ? 'before' : 'none',
        margin: [0, 0, 0, 0],
      },
      { text: fun_.numFormatTwoDecimals(detalle.deposito), pageBreak: br_ ? 'before' : 'none', alignment: 'right' },
      { text: fun_.numFormatTwoDecimals(detalle.balance_factura), alignment: 'right', pageBreak: br_ ? 'before' : 'none', margin: [0, 0, 20, 0] },
    );
    tempBody.push(row);
  });

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
                          text: [{ text: 'Recibido Por', style: 'letra12', bold: true }],
                          margin: [35, 5, 0, 0],
                        },
                      ],
                      [
                        {
                          text: [{ text: 'Entregado Por', style: 'letra12', bold: true }],
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
                        margin: [0, 0, data.contenido_reporte.length <= 6 ? 25 : 45, 0],
                        alignment: 'right',
                        text: [
                          {
                            text: 'TOTAL RD$:         ',
                            bold: true,
                          },
                          { text: fun_.numFormatTwoDecimals(data.total), style: 'letra12' },
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
