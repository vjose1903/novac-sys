/* eslint-disable @typescript-eslint/indent */
import * as fun_ from '../utils/funciones';
import { styles_ } from '../utils/files';
import { Ss } from '../../singleton.service';
import { ConfigI } from '../../../interface/config-interface';
import { getContentWithTablaNormal } from '../utils/tabla_normal';
import { infoPropietarioPartes, infoFacturaPartes, cierrePdf, infoResumenPartes } from './infoPdfs';
import { config_ventas } from './configuraciones/ventas';
import { config_recibo_ingreso } from './configuraciones/recibo_ingreso';
import { config_conduce } from './configuraciones/conduce';
import { config_cuadre_caja } from './configuraciones/cuadre_caja';
import { config_cotizacion } from './configuraciones/cotizacion';
import { config_pre_venta } from './configuraciones/pre_venta';
import { config_notas } from './configuraciones/notas';

const configuraciones = {
  pre_venta: config_pre_venta,
  ventas: config_ventas,
  recibo_ingreso: config_recibo_ingreso,
  conduce: config_conduce,
  notas: config_notas,
  cuadre_caja: config_cuadre_caja,
  cotizacion: config_cotizacion,
};

export function makePDF(data, file_name, tipo_pdf?) {
  const is_compra = data?.tipo == 'compra' ? true : false;

  const is_suplidor = is_compra;

  const configApp: ConfigI = Ss.configServ.getConfig({ isPromise: false });

  const dd = {
    pageSize: { width: 200, height: 'auto' },
    pageOrientation: 'portrait',
    pageMargins: [5, 20, 5, 20],
    content: contenidoPDF(data, is_suplidor, configApp, tipo_pdf),
    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
      barcode: fun_.my_barcode(data.identificador),
    },
    styles: styles_,
  };

  const obj = { doc: dd, file: file_name, type: 'file', pageOrientation: 'portrait' };
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
          fit: [120, 120],
          // "width": 220,
        },
        {
          text: configApp.nombre_empresa,
          bold: true,
          style: 'letra13',
          margin: [0, 10, 0, 0],
        },
        {
          text: configApp.direccion_empresa,
          bold: false,
          style: 'letra8',
          margin: [0, 5, 0, 0],
        },
        {
          alignment: 'center',
          margin: [0, 3, 0, 0],
          text: [
            { text: 'Telefono: ', bold: true, style: 'letra8' },
            { text: configApp.telefono_empresa, style: 'letra8' },
            { text: ' RNC: ', bold: true, style: 'letra8' },
            { text: configApp.rnc_empresa, style: 'letra8' },
          ],
        },
        // ---------- DATOS DE LA FACTURA -----------
        {
          margin: [0, 10, 0, 0],
          stack: [...parseInfoFactura(data, tipo_pdf)],
        },
        // ---------- DATOS DEL PROPIETARIO ----------
        {
          margin: [0, 10, 0, 0],

          stack: [...parseInfoPropietario(data, tipo_pdf, is_suplidor)],
        },
        {
          margin: [0, 5, 0, 0],
          canvas: [{ type: 'rect', x: 0, y: 0, w: 190, h: 1, color: '#000000' }],
        },
        // ---------- TIPO PDF ----------
        {
          alignment: 'center',
          margin: [0, 5, 0, 5],
          text: data.tipo_pdf,
          style: 'letra9',
          bold: true,
        },
        {
          margin: [0, 0, 0, 0],
          canvas: [{ type: 'rect', x: 0, y: 0, w: 190, h: 1, color: '#000000' }],
        },
        {
          margin: [0, 5, 0, 0],
          canvas: [{ type: 'rect', x: 0, y: 0, w: 190, h: 2, color: '#000000' }],
        },
        // ---------- TABLA ----------
        ...tabla_detalles,

        {
          margin: [0, 0, 0, 0],
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
      margin: [0, 20, 0, 0],
      text: [
        { text: 'Realizado por: ', bold: true, style: 'letra8' },
        { text: data.usuario, style: 'letra8' },
      ],
    } as any);
  }

  // -------- BARCODE --------
  if (cierrePdf['barcode'].includes(tipo_pdf)) content[0].stack.push({ margin: [0, 15, 0, 0], image: 'barcode', width: 182, height: 50 } as any);

  return content;
}

function parseResumen(data, tipo_pdf) {
  const resumen = [];
  if (!infoResumenPartes[tipo_pdf].length) return [{ text: '' }];

  const partes = [
    {
      key: 'bruto',
      item: [
        { text: 'BRUTO:', bold: true, alignment: 'left', style: 'letra8', margin: [0, 0, 0, 0] },
        { text: fun_.roundNumberToDecimal(data.Bruto), alignment: 'right', style: 'letra8', bold: true, margin: [0, 0, 5, 0] },
      ],
    },
    {
      key: 'descuento',
      item: [
        { text: 'DESCUENTO:', bold: true, alignment: 'left', style: 'letra8', margin: [0, 0, 0, 0] },
        { text: fun_.roundNumberToDecimal(data.descuento), alignment: 'right', style: 'letra8', bold: true, margin: [0, 0, 5, 0] },
      ],
    },
    {
      key: 'total',
      item: [
        { text: 'TOTAL A PAGAR:', bold: true, fillColor: '#d8d8d8', alignment: 'left', style: 'letra8', margin: [0, 0, 0, 0] },
        { text: fun_.roundNumberToDecimal(data.total), alignment: 'right', fillColor: '#d8d8d8', style: 'letra8', bold: true, margin: [0, 0, 5, 0] },
      ],
    },
    {
      key: 'efectivo',
      item: [
        { text: 'EFECTIVO', bold: true, alignment: 'left', style: 'letra8', margin: [0, 0, -5, 0] },
        { text: fun_.roundNumberToDecimal(data.total + data.devuelta), bold: true, alignment: 'right', style: 'letra8', margin: [0, 0, 5, 0] },
      ],
    },
    {
      key: 'cambio',
      item: [
        { text: 'CAMBIO', alignment: 'left', style: 'letra8', margin: [0, 0, -5, 0] },
        { text: fun_.roundNumberToDecimal(data.devuelta), alignment: 'right', style: 'letra8', margin: [0, 0, 5, 0] },
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
          { text: 'NCF                     : ', bold: true, style: 'letra8' },
          { text: data.numero_comprobante || '', style: 'letra8' },
        ],
      },
    },
    {
      key: 'no_documento',
      item: {
        alignment: 'left',
        text: [
          { text: 'No. Documento : ', bold: true, style: 'letra8' },
          { text: fun_.my_padStart(data.numero_documento || '', 8, '0'), style: 'letra8' },
        ],
      },
    },

    {
      key: 'fecha',
      item: {
        alignment: 'left',
        text: [
          { text: 'Fecha                  : ', style: 'letra8' },
          { text: `${fun_.my_dateFormater(data.fecha || '')} - ${fun_.my_houreFormater(data.fecha || '')}`, style: 'letra8' },
        ],
      },
    },
    {
      key: 'condición',
      item: {
        alignment: 'left',
        text: [
          { text: 'Condición           : ', bold: true, style: 'letra8' },
          { text: fun_.my_capitalize(data.condicion || ''), style: 'letra8' },
        ],
      },
    },
    {
      key: 'valida',
      item: {
        alignment: 'left',
        text: [
          { text: 'Válida Hasta       : ', bold: true, style: 'letra8' },
          { text: data.tipo_factura_id == 3 ? 'No aplica.' : fun_.my_dateFormater(data?.fecha_valida), style: 'letra8' },
        ],
      },
    },
    {
      key: 'valida',
      item: {
        alignment: 'left',
        text: [
          { text: 'Válida Hasta       : ', bold: true, style: 'letra10' },
          { text: data.tipo_factura_id == 3 ? 'No aplica.' : fun_.my_dateFormater(data?.fecha_valida), style: 'letra10' },
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
  const entidad_label = is_suplidor ? 'Suplidor               : ' : 'Cliente                : ';
  const entidad = is_suplidor ? data.suplidor : data.cliente;

  const partes = [
    {
      key: 'nombre',
      item: {
        alignment: 'left',
        text: [
          { text: entidad_label, bold: true, style: 'letra8' },
          { text: entidad.nombre || '', style: 'letra8' },
        ],
      },
    },
    {
      key: 'doc_identidad',
      item: {
        alignment: 'left',
        text: [
          { text: 'Doc. identidad   : ', bold: true, style: 'letra8' },
          { text: entidad.rnc || '', style: 'letra8' },
        ],
      },
    },
    {
      key: 'telefono',
      item: {
        alignment: 'left',
        text: [
          { text: 'Telefono             : ', bold: true, style: 'letra8' },
          { text: entidad.telefono || '', style: 'letra8' },
        ],
      },
    },
    {
      key: 'direccion',
      item: {
        alignment: 'left',
        text: [
          { text: 'Direccion            : ', bold: true, style: 'letra8' },
          { text: entidad.direccion || '', style: 'letra8' },
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
