/* eslint-disable @typescript-eslint/indent */
import * as fun_ from './utils/funciones';
import { styles_ } from './utils/files';
import { SingletonService } from '../singleton.service';
import { ConfigI } from '../../typescript/config-interface';

// ==========================================================================================================================================================
// UNIR CONDUCE
// ==========================================================================================================================================================

export function makePDF(data) {
  const configApp: ConfigI = SingletonService.configServ.getConfig({ isPromise: false });

  const dd = {
    pageSize: { width: 990, height: 398 },
    pageMargins: [10, 140, 10, 30],
    header: cabeceraConduce(data, configApp),
    content: contenidoConduce(data),
    footer: function (currentPage, pageCount) {
      return [
        {
          text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
          alignment: 'right',
          margin: [0, 0, 30, 5],
        },
      ];
    },
    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
    },
    styles: styles_,
  };

  const obj = { doc: dd, file: 'conduce.pdf', type: 'file' };
  return obj;
}

// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraConduce(data, configApp: ConfigI) {
  const rncCliente = data.cliente.documentos_de_identidad.filter((doc) => doc.principal === true)[0].documento;

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
      ],
    },
    {
      margin: [0, -40, 0, 0],
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
        },
        {
          text: [
            { text: 'Telefono: ', style: 'letra11  ' },
            { text: configApp.telefono_empresa + ' ', style: 'letra11' },
            { text: ' RNC: ', bold: true, style: 'letra11' },
            { text: configApp.rnc_empresa, style: 'letra11' },
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
            text: [
              { text: 'Cliente: ', style: 'letra12' },
              { text: fun_.my_capitalize(data.cliente.nombre) + ' ' + fun_.my_capitalize(data.cliente.apellido), style: 'letra12' },
            ],
            margin: [0, 0, 0, 0],
          },
          {
            text: [
              { text: 'Rnc cliente: ', style: 'letra12' },
              { text: rncCliente, style: 'letra12' },
            ],
            margin: [0, 3, 0, 0],
          },
          {
            text: [
              { text: 'Dirección: ', style: 'letra12' },
              { text: data.cliente.direccion, style: 'letra12' },
            ],
            margin: [0, 3, 0, 0],
          },
        ],
        [
          {
            text: [{ text: 'Conduce de mercancia', style: 'letra14', bold: true }],
            margin: [0, 15, 0, 0],
            alignment: 'center',
          },
        ],
        [
          {
            text: [
              { text: 'Fecha: ', style: 'letra12' },
              { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra12' },
              { text: ' - ' + fun_.my_houreFormater(data.fecha_equivalente), style: 'letra12' },
            ],
            margin: [150, 0, 0, 0],
          },

          {
            text: [
              { text: 'Doc No: ', style: 'letra12' },
              { text: fun_.my_padStart(data.numero_conduce, 8, '0'), style: 'letra12' },
            ],
            margin: [150, 3, 0, 0],
          },
        ],
      ],
    },
  ];

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================

function contenidoConduce(data) {
  const tempBody = [];
  tempBody.push([
    {
      text: '#',
      style: 'tableHeader',
      alignment: 'left',
      bold: true,
      margin: [6, 0, 0, 0],
    },
    {
      text: 'Cantidad',
      style: 'tableHeader',
      bold: true,
      margin: [0, 0, 0, 0],
      alignment: 'center',
    },
    {
      text: 'Descripción',
      style: 'tableHeader',
      bold: true,
      alignment: 'left',
      margin: [80, 0, 0, 0],
    },
  ]);

  for (let i = 0; i < data.detalle_conduces.length; i++) {
    const row = [];
    const detalle = data.detalle_conduces[i];
    const br_ = (i + 1) % 7 === 0;

    row.push(
      { text: i + 1, pageBreak: br_ ? 'before' : 'none', alignment: 'left', margin: [6, 0, 0, 0] },
      { text: detalle.cantidad, alignment: 'right', pageBreak: br_ ? 'before' : 'none', margin: [0, 0, 0, 0] },
      { text: detalle.descripcion, pageBreak: br_ ? 'before' : 'none', alignment: 'left', margin: [80, 0, 0, 0] },
    );
    tempBody.push(row);
  }

  const content = [
    {
      margin: [0, -2, 0, 0],
      table: {
        headerRows: 1,
        widths: [50, 'auto', '*'],
        body: tempBody,
      },

      layout: {
        hLineWidth: (i, node) => {
          return i === 0 || i === 1 ? 2 : i % 7 === 0 && node.table.body.length !== 7 ? 0 : i === node.table.body.length ? 2 : 1;
        },
        vLineWidth: (i, node) => {
          return 0;
        },
        hLineColor: (i, node) => {
          return i === 0 || i === 1 ? 'black' : i === node.table.body.length ? 'black' : 'gray';
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
          canvas: [
            {
              type: 'rect',
              x: 10,
              y: 0,
              w: 160,
              h: 1,
              color: '#000000',
            },
            {
              type: 'rect',
              x: 250,
              y: 0,
              w: 160,
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
                margin: [50, 5, 0, 0],
              },
            ],
            [
              {
                text: [{ text: 'Cliente', style: 'letra12', bold: true }],
                margin: [-195, 5, 0, 0],
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
