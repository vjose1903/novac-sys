import * as fun_ from './utils/funciones';
import { logoADM } from './utils/files';
import { AppConfig } from '../src/environments/environment.js';

// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================

export function makeConduce(data) {
  const dd = {
    pageSize: { width: 850, height: 400 },
    pageMargins: [10, 153, 10, 30],
    header: cabeceraConduce(data),
    content: contenidoConduce(data),
    footer: function (currentPage, pageCount) {
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
    type: 'file',
  };
  return obj;
}

// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraConduce(data) {
  const rncCliente = data.cliente.documentos_de_identidad.filter((doc) => doc.principal === true)[0].documento;

  const header = [
    {
      columns: [[{ image: 'logo', width: 72, opacity: 0.85, margin: [90, 12, 0, 0] }]],
    },
    {
      margin: [0, -62, 0, 0],
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
    {
      margin: [15, 20, 0, 0],
      columns: [
        [
          {
            text: [{ text: 'Cliente: ', fontSize: 12, bold: true }, { text: fun_.my_capitalize(data.cliente.nombre) + ' ' + fun_.my_capitalize(data.cliente.apellido) }],
            margin: [0, 0, 0, 0],
          },
          {
            text: [{ text: 'Rnc cliente: ', fontSize: 12, bold: true }, { text: rncCliente }],
            margin: [0, 3, 0, 0],
          },
          {
            text: [{ text: 'Dirección: ', fontSize: 12, bold: true }, { text: data.cliente.direccion }],
            margin: [0, 3, 0, 0],
          },
        ],
        [
          {
            text: [{ text: 'Conduce de mercancia', fontSize: 14, bold: true }],
            margin: [0, 15, 0, 0],
            alignment: 'center',
          },
        ],
        [
          {
            text: [
              { text: 'Fecha: ', fontSize: 12, bold: true },
              { text: fun_.my_dateFormater(data.fecha_equivalente), fontSize: 12 },
              { text: ' - ' + fun_.my_houreFormater(data.fecha_equivalente), fontSize: 12 },
            ],
            margin: [70, 0, 0, 0],
          },

          {
            text: [
              { text: 'Doc No: ', fontSize: 12, bold: true },
              { text: fun_.my_padStart(data.numero_conduce, 8, '0'), fontSize: 12 },
            ],
            margin: [70, 3, 0, 0],
          },
        ],
      ],
    },
    {
      canvas: [
        {
          type: 'rect',
          x: 10,
          y: 5,
          w: 795,
          h: 2,
          color: '#000000',
        },
      ],
    },
    {
      style: 'tableExample',
      table: {
        headerRows: 1,
        widths: [23, 60, 120, '*'],
        body: [
          [
            {
              text: '#',
              style: 'tableHeader',
              bold: true,
              margin: [4, 0, 0, 0],
            },
            {
              text: 'Cantidad',
              style: 'tableHeader',
              bold: true,
              margin: [0, 0, 0, 0],
              alignment: 'right',
            },
            {
              text: 'Unidad',
              style: 'tableHeader',
              bold: true,
              alignment: 'right',
              margin: [0, 0, 60, 0],
            },
            {
              text: 'Descripción',
              style: 'tableHeader',
              bold: true,
              alignment: 'left',
              margin: [-20, 0, 0, 0],
            },
          ],
          [1, 'Sample value 1', 'value 2', 'value 2'],
        ],
      },
      margin: [10, 0, 10, 0],
      layout: 'headerLineOnly',
    },
  ];

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================

function contenidoConduce(data) {
  const tempBody = [];
  data.detalle_conduces.forEach((detalle, i) => {
    const row = [];

    const br_ = i !== 0 && i % 12 === 0;

    row.push(
      { text: i + 1, pageBreak: br_ ? 'before' : 'none' },
      { text: fun_.numFormatTwoDecimals(detalle.cantidad), alignment: 'right', pageBreak: br_ ? 'before' : 'none', margin: [0, 0, 10, 0] },
      { text: detalle.unidad, pageBreak: br_ ? 'before' : 'none', alignment: 'right', margin: [0, 0, 50, 0] },
      { text: detalle.descripcion, pageBreak: br_ ? 'before' : 'none', alignment: 'left' },
    );
    tempBody.push(row);
  });

  const content = [
    {
      margin: [0, -2, 0, 0],
      table: {
        widths: [23, 60, 120, '*'],
        body: tempBody,
      },

      layout: {
        hLineWidth: function (i, node) {
          return i % 12 === 0 && node.table.body.length !== 12 ? 0 : i === node.table.body.length ? 2 : 1;
        },
        vLineWidth: function (i, node) {
          return 0;
        },
        hLineColor: function (i, node) {
          return i === node.table.body.length ? 'black' : 'gray';
        },
        vLineColor: function (i, node) {
          return 'black';
        },
      },
    },
    {
      text: [
        { text: 'Realizado Por :  ', style: 'letra11', bold: true },
        { text: fun_.my_capitalize(data.user.nombre) + ' ' + fun_.my_capitalize(data.user.apellido), style: 'letra11' },
      ],

      margin: [5, 5, 0, 0],
    },
    {
      stack: [
        {
          canvas: [
            {
              type: 'rect',
              x: 40,
              y: 45,
              w: 140,
              h: 1,
              color: '#000000',
            },
            {
              type: 'rect',
              x: 305,
              y: 45,
              w: 140,
              h: 1,
              color: '#000000',
            },
          ],
          margin: [0, 30, 0, 0],
        },
        {
          columns: [
            [
              {
                text: [{ text: 'Revisada Por', fontSize: 12, bold: true }],
                margin: [75, 5, 0, 0],
              },
            ],
            [
              {
                text: [{ text: 'Cliente', fontSize: 12, bold: true }],
                margin: [-37, 5, 0, 0],
              },
            ],
          ],
        },
      ],
      margin: [0, -40, 0, 0],
      unbreakable: true,
    },
  ];

  return content;
}
