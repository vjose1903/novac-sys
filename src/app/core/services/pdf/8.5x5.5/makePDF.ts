/* eslint-disable @typescript-eslint/indent */
import * as fun_ from '../utils/funciones';
import { styles_ } from '../utils/files';
import { SingletonService } from '../../singleton.service';
import { ConfigI } from '../../../typescript/config-interface';
import { getContentWithTablaNormal } from '../tabla_normal';
import { infoPropietarioPartes, infoFacturaPartes, cierrePdf, infoResumenPartes } from './infoPdfs';
import { config_notas } from './configuraciones/notas';
import { config_ventas } from './configuraciones/ventas';
import { config_recibo_ingreso } from './configuraciones/recibo_ingreso';
import { config_conduce } from './configuraciones/conduce';
import { config_cuadre_caja } from './configuraciones/cuadre_caja';

const configuraciones = {
  notas: config_notas,
  ventas: config_ventas,
  recibo_ingreso: config_recibo_ingreso,
  conduce: config_conduce,
  cuadre_caja: config_cuadre_caja,
};

export function makePDF(data, file_name, tipo_pdf?) {
  const is_compra = data.FACTURA_DE === 'compra' ? true : false;

  const is_suplidor = is_compra;

  const configApp: ConfigI = SingletonService.configServ.getConfig({ isPromise: false });
  const configuration = configuraciones[tipo_pdf];

  const dd = {
    pageSize: configuration.pageSize,
    pageMargins: configuration.margin_general,
    // header: (currentPage, pageCount, pageSize) => {
    //   return cabeceraFacturaVenta(data, is_nota, is_contado, is_venta, currentPage, pageCount, configApp);
    // },
    // content: contenidoFacturaVenta(data, is_nota, is_contado, is_venta),
    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
    },
    styles: styles_,
  };
  // const dd = {
  //   pageSize: { width: 302, height: 'auto' },
  //   pageOrientation: 'portrait',
  //   pageMargins: [20, 40, 20, 20],
  //   content: contenidoPDF(data, is_suplidor, configApp, tipo_pdf),
  //   images: {
  //     logo: `data:image/png;base64,${configApp.logo_impresion}`,
  //     barcode: fun_.my_barcode(data.identificador),
  //   },
  //   styles: styles_,
  // };

  const obj = { doc: dd, file: file_name, type: 'file' };
  return obj;
}

// ==========================================================================================================================================================
// CONTENIDO
// ==========================================================================================================================================================

function contenidoPDF(data, is_suplidor, configApp: ConfigI, tipo_pdf) {
  const configuration = configuraciones[tipo_pdf];

  data.tipo_tabla = 'normal';

  const tabla_detalles = getContentWithTablaNormal(configuration, data);

  const content = [
    {
      alignment: 'center',
      stack: [
        {
          image: 'logo',
          fit: [220, 220],
          // "width": 220,
        },
        {
          text: configApp.nombre_empresa,
          bold: true,
          style: 'letra17',
          margin: [0, 10, 0, 0],
        },
        {
          text: configApp.direccion_empresa,
          bold: false,
          style: 'letra11',
          margin: [0, 5, 0, 0],
        },
        {
          alignment: 'center',
          margin: [0, 3, 0, 0],
          text: [
            { text: 'Telefono: ', bold: true, style: 'letra11' },
            { text: configApp.telefono_empresa, style: 'letra11' },
            { text: ' RNC: ', bold: true, style: 'letra11' },
            { text: configApp.rnc_empresa, style: 'letra11' },
          ],
        },
        // ---------- DATOS DE LA FACTURA -----------
        {
          margin: [-10, 20, 0, 0],
          stack: [...parseInfoFactura(data, tipo_pdf)],
        },
        // ---------- DATOS DEL PROPIETARIO ----------
        {
          margin: [-10, 20, 0, 0],

          stack: [...parseInfoPropietario(data, tipo_pdf, is_suplidor)],
        },
        {
          margin: [0, 20, 0, 0],
          canvas: [{ type: 'rect', x: 0, y: 0, w: 300, h: 1, color: '#000000' }],
        },
        // ---------- TIPO PDF ----------
        {
          alignment: 'center',
          margin: [0, 5, 0, 5],
          text: data.tipo_pdf,
          style: 'letra12',
          bold: true,
        },
        {
          margin: [0, 0, 0, 0],
          canvas: [{ type: 'rect', x: 0, y: 0, w: 300, h: 1, color: '#000000' }],
        },
        {
          margin: [0, 5, 0, 0],
          canvas: [{ type: 'rect', x: 0, y: 0, w: 300, h: 2, color: '#000000' }],
        },
        // ---------- TABLA ----------
        ...tabla_detalles,

        {
          margin: [-19, 0, -19, 0],
          layout: 'noBorders',
          table: {
            headerRows: 0,
            widths: ['*', 'auto'],
            body: [...parseResumen(data, tipo_pdf)],
          },
        },
      ],
    },
  ];

  // -------- PDF CREADO POR --------
  if (cierrePdf['usuario'].includes(tipo_pdf)) {
    content[0].stack.push({
      alignment: 'left',
      margin: [-10, 30, 0, 0],
      text: [
        { text: 'Realizado por: ', bold: true, style: 'letra11' },
        { text: data.usuario, style: 'letra11' },
      ],
    } as any);
  }

  // -------- BARCODE --------
  if (cierrePdf['barcode'].includes(tipo_pdf)) content[0].stack.push({ margin: [0, 20, 0, 0], image: 'barcode', width: 295, height: 70 } as any);

  return content;
}

function parseResumen(data, tipo_pdf) {
  const resumen = [];
  if (!infoResumenPartes[tipo_pdf].length) return [{ text: '' }];

  const partes = [
    {
      key: 'bruto',
      item: [
        { text: 'BRUTO:', bold: true, alignment: 'left', style: 'letra10', margin: [10, 0, 0, 0] },
        { text: fun_.numFormatTwoDecimals(data.Bruto), alignment: 'right', style: 'letra10', bold: true, margin: [0, 0, 10, 0] },
      ],
    },
    {
      key: 'descuento',
      item: [
        { text: 'DESCUENTO:', bold: true, alignment: 'left', style: 'letra10', margin: [10, 0, 0, 0] },
        { text: fun_.numFormatTwoDecimals(data.descuento), alignment: 'right', style: 'letra10', bold: true, margin: [0, 0, 10, 0] },
      ],
    },
    {
      key: 'total',
      item: [
        { text: 'TOTAL A PAGAR:', bold: true, fillColor: '#d8d8d8', alignment: 'left', style: 'letra10', margin: [10, 0, 0, 0] },
        { text: fun_.numFormatTwoDecimals(data.total), alignment: 'right', fillColor: '#d8d8d8', style: 'letra10', bold: true, margin: [0, 0, 10, 0] },
      ],
    },
    {
      key: 'efectivo',
      item: [
        { text: 'EFECTIVO', bold: true, alignment: 'left', style: 'letra10', margin: [10, 0, -5, 0] },
        { text: fun_.numFormatTwoDecimals(data.total + data.devuelta), bold: true, alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
      ],
    },
    {
      key: 'cambio',
      item: [
        { text: 'CAMBIO', alignment: 'left', style: 'letra10', margin: [10, 0, -5, 0] },
        { text: fun_.numFormatTwoDecimals(data.devuelta), alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
      ],
    },
  ];

  for (let index = 0; index < partes.length; index++) {
    const parte = partes[index];
    if (infoResumenPartes[tipo_pdf].includes(parte.key)) resumen.push(parte.item);
  }

  return resumen;
}

function parseInfoFactura(data, tipo_pdf) {
  const contenido = [];
  if (!infoFacturaPartes[tipo_pdf].length) return [{ text: '' }];

  const partes = [
    {
      key: 'ncf',
      item: {
        alignment: 'left',
        text: [
          { text: 'NCF                     : ', bold: true, style: 'letra10' },
          { text: data.numero_comprobante || '', style: 'letra10' },
        ],
      },
    },
    {
      key: 'no_documento',
      item: {
        alignment: 'left',
        text: [
          { text: 'No. Documento : ', bold: true, style: 'letra10' },
          { text: fun_.my_padStart(data.numero_documento || '', 8, '0'), style: 'letra10' },
        ],
      },
    },

    {
      key: 'fecha',
      item: {
        alignment: 'left',
        text: [
          { text: 'Fecha                  : ', style: 'letra10' },
          { text: `${fun_.my_dateFormater(data.fecha || '')} - ${fun_.my_houreFormater(data.fecha || '')}`, style: 'letra10' },
        ],
      },
    },
    {
      key: 'condición',
      item: {
        alignment: 'left',
        text: [
          { text: 'Condición           : ', bold: true, style: 'letra10' },
          { text: fun_.my_capitalize(data.condicion || ''), style: 'letra10' },
        ],
      },
    },
  ];

  for (let index = 0; index < partes.length; index++) {
    const parte = partes[index];

    if (infoFacturaPartes[tipo_pdf].includes(parte.key)) {
      parte.item['margin'] = [0, contenido.length ? 3 : 0, 0, 0];
      contenido.push(parte.item);
    }
  }
  return contenido;
}

function parseInfoPropietario(data, tipo_pdf, is_suplidor) {
  const contenido = [];

  if (!infoPropietarioPartes[tipo_pdf].length) return [{ text: '' }];

  const partes = [
    {
      key: 'nombre',
      item: {
        alignment: 'left',
        text: [
          is_suplidor ? { text: 'Suplidor               : ', bold: true, style: 'letra10' } : { text: 'Cliente                : ', bold: true, style: 'letra10' },
          is_suplidor ? { text: data.suplidor.nombre || '', style: 'letra10' } : { text: `${data.cliente.nombre || ''} ${data.cliente.apellido || ''}`, style: 'letra10' },
        ],
      },
    },
    {
      key: 'doc_identidad',
      item: {
        alignment: 'left',
        text: [{ text: 'Doc. identidad   : ', bold: true, style: 'letra10' }, is_suplidor ? { text: data.suplidor.rnc || '', style: 'letra10' } : { text: data.cliente.rnc || '', style: 'letra10' }],
      },
    },
    {
      key: 'telefono',
      item: {
        alignment: 'left',
        text: [
          { text: 'Telefono             : ', bold: true, style: 'letra10' },
          is_suplidor ? { text: data.suplidor.telefono || '', style: 'letra10' } : { text: data.cliente.telefono || '', style: 'letra10' },
        ],
      },
    },
  ];

  for (let index = 0; index < partes.length; index++) {
    const parte = partes[index];

    if (infoPropietarioPartes[tipo_pdf].includes(parte.key)) {
      parte.item['margin'] = [0, contenido.length ? 3 : 0, 0, 0];
      contenido.push(parte.item);
    }
  }
  return contenido;
}
