/* eslint-disable @typescript-eslint/indent */
import * as _ from 'lodash';
import * as fun_ from '../utils/funciones';
import { styles_ } from '../utils/files';
import { SingletonService } from '../../singleton.service';
import { ConfigI } from '../../../typescript/config-interface';
import { getContentWithTablaNormal } from '../tabla_normal';
import { infoPropietarioPartes, infoFacturaPartes, cierrePdf, infoResumenPartes, infoTipoPdf, firmas } from './infoPdfs';
import { config_notas } from './configuraciones/notas';
import { config_ventas } from './configuraciones/ventas';
import { config_recibo_ingreso } from './configuraciones/recibo_ingreso';
import { config_conduce } from './configuraciones/conduce';
import { config_cuadre_caja } from './configuraciones/cuadre_caja';
import { FunctionService } from '../../functions.service';

const configuraciones = {
  notas: config_notas,
  ventas: config_ventas,
  recibo_ingreso: config_recibo_ingreso,
  conduce: config_conduce,
  cuadre_caja: config_cuadre_caja,
};

export function makePDF(data, file_name, tipo_pdf?) {
  const fun = SingletonService.fun;
  const is_compra = data?.FACTURA_DE === 'compra' ? true : false;

  const is_suplidor = is_compra;

  const configApp: ConfigI = SingletonService.configServ.getConfig({ isPromise: false });
  const configuration = configuraciones[tipo_pdf];

  const dd = {
    pageSize: configuration.pageSize,
    pageMargins: configuration.pageMargins,
    header: (currentPage, pageCount, pageSize) => cabeceraPDF({ data, currentPage, pageCount, pageSize, is_suplidor, configApp, tipo_pdf }),
    content: contenidoPDF({ fun, data, is_suplidor, configApp, tipo_pdf }),
    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
    },
    styles: styles_,
  };

  const obj = { doc: dd, file: file_name, type: 'file' };
  return obj;
}

// ==========================================================================================================================================================
// Cabecera
// ==========================================================================================================================================================
function cabeceraPDF(args: { data: any; currentPage: any; pageCount: any; pageSize: any; is_suplidor: boolean; configApp: ConfigI; tipo_pdf: any }) {
  const { data, currentPage, pageCount, pageSize, is_suplidor, configApp, tipo_pdf } = args;
  const header = [
    {
      columns: [
        [
          { text: 'pag: ' + currentPage.toString() + ' de ' + pageCount, alignment: 'left', margin: [15, 10, 0, 0] },
          { image: 'logo', width: 70, height: 65, margin: [90, -12, 0, 0] },
        ],
        [
          {
            margin: [0, 15, 0, 0],
            stack: [
              { text: configApp.nombre_empresa, alignment: 'center', bold: true, style: 'letra17' },
              { text: configApp.direccion_empresa, alignment: 'center' },
              {
                text: [
                  { text: 'Telefono: ', style: 'letra12  ' },
                  { text: configApp.telefono_empresa + ' ', style: 'letra12' },
                  { text: ' RNC: ', bold: true, style: 'letra12' },
                  { text: configApp.rnc_empresa, style: 'letra12' },
                ],
                alignment: 'center',
              },
            ],
          },
        ],
        parseTipoPdf(data, tipo_pdf),
      ],
    },
    { margin: [15, 3, 0, 0], columns: [{ stack: parseInfoPropietario(data, tipo_pdf, is_suplidor) }, { margin: [240, 0, 0, 0], stack: parseInfoFactura(data, tipo_pdf) }] },
    { canvas: [{ type: 'rect', x: 15, y: 5, w: pageSize.width - 30, h: 2, color: '#000000' }] },
  ];

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// ==========================================================================================================================================================

function contenidoPDF(args: { fun: FunctionService; data: any; is_suplidor: any; configApp: ConfigI; tipo_pdf: any }) {
  const { fun, data, is_suplidor, configApp, tipo_pdf } = args;

  const configuration = configuraciones[tipo_pdf];

  data.tipo_tabla = 'normal';

  const tabla_detalles = getContentWithTablaNormal(configuration, data);

  const content = [
    // ---------- TABLA ----------
    ...tabla_detalles,
    // ---------- DETALLE RESUMEN ----------
    {
      margin: [15, 5, 15, 0],
      stack: [
        {
          columns: [
            {
              alignment: 'left',
              text: [
                { text: 'Realizado por: ', bold: true, style: 'letra13' },
                { text: data?.usuario, style: 'letra13' },
              ],
            },

            {
              layout: 'noBorders',
              table: {
                headerRows: 0,
                widths: ['*', 'auto'],
                body: [...parseResumen(data, tipo_pdf)],
              },
            },
          ],
        },
      ],
    },
  ];

  const detalle_resumen_stack = _.last(content);

  detalle_resumen_stack.stack.push(parseFirmasPdf({ tipo_pdf, fun }));

  // cliente

  // -------- BARCODE --------
  // if (cierrePdf['barcode'].includes(tipo_pdf)) detalle_resumen_stack.stack.push({ margin: [0, 20, 0, 0], image: 'barcode', width: 295, height: 70 } as any);

  return content;
}

function parseFirmasPdf(args: { fun: FunctionService; tipo_pdf: any }) {
  const { fun, tipo_pdf } = args;

  if (!firmas[tipo_pdf].length) return [{ text: '' }];

  const mainTable = { margin: [0, 40, 0, 0], layout: 'noBorders', table: { headerRows: 0, widths: [], body: [[]] } };

  const innerTabla = { table: { headerRows: 0, widths: [160], body: [] } };

  const entidades = ['realizado_por', 'cliente'];

  entidades.forEach((entidad, index) => {
    if (firmas[tipo_pdf].includes(entidad)) {
      const tabla_molde = fun.duplicarJson(innerTabla);

      tabla_molde.table.body.push([{ text: fun.Capitalice(entidad.split('_').join(' ')), alignment: 'center', style: 'letra12', border: [false, true, false, false] }]);

      mainTable.table.widths.push(170);
      mainTable.table.body[0].push(tabla_molde);
    }
  });

  return mainTable;
}

function parseTipoPdf(data, tipo_pdf) {
  const contenido = [];
  if (!infoTipoPdf[tipo_pdf].length) return [{ text: '' }];

  const partes = [
    {
      key: 'titulo',
      item: [{ text: data?.tipo_pdf, alignment: 'right', bold: true, style: 'letra16', margin: [0, 15, 15, 0] }],
    },
  ];

  partes.forEach((parte) => {
    if (infoTipoPdf[tipo_pdf].includes(parte.key)) {
      parte.item['margin'] = [0, contenido.length ? 2 : 15, 15, 0];
      contenido.push(parte.item);
    }
  });

  return contenido;
}

function parseResumen(data, tipo_pdf) {
  const resumen = [];
  if (!infoResumenPartes[tipo_pdf].length) return [{ text: '' }];

  const partes = [
    {
      key: 'bruto',
      item: [
        { text: 'BRUTO:', bold: true, alignment: 'right', style: 'letra12', margin: [0, 0, 10, 0] },
        { text: fun_.numFormatTwoDecimals(data?.Bruto), alignment: 'right', style: 'letra12', bold: true },
      ],
    },
    {
      key: 'descuento',
      item: [
        { text: 'DESCUENTO:', bold: true, alignment: 'right', style: 'letra12', margin: [0, 0, 10, 0] },
        { text: fun_.numFormatTwoDecimals(data?.descuento), alignment: 'right', style: 'letra12', bold: true },
      ],
    },
    {
      key: 'total',
      item: [
        { text: 'TOTAL:', bold: true, alignment: 'right', style: 'letra12', margin: [0, 0, 10, 0] },
        { text: fun_.numFormatTwoDecimals(data?.total), alignment: 'right', style: 'letra12', bold: true },
      ],
    },
    {
      key: 'efectivo',
      item: [
        { text: 'EFECTIVO', bold: true, alignment: 'right', style: 'letra12', margin: [0, 0, 10, 0] },
        { text: fun_.numFormatTwoDecimals(data?.total + data?.devuelta), bold: true, alignment: 'right', style: 'letra12' },
      ],
    },
    {
      key: 'cambio',
      item: [
        { text: 'CAMBIO', alignment: 'right', style: 'letra12', margin: [0, 0, 10, 0] },
        { text: fun_.numFormatTwoDecimals(data?.devuelta), alignment: 'right', style: 'letra12' },
      ],
    },
  ];

  partes.forEach((parte) => {
    if (infoResumenPartes[tipo_pdf].includes(parte.key)) resumen.push(parte.item);
  });

  return resumen;
}

function parseInfoFactura(data, tipo_pdf) {
  const contenido = [];
  if (!infoFacturaPartes[tipo_pdf].length) return [{ text: '' }];

  const partes = [
    {
      key: 'fecha',
      item: {
        alignment: 'left',
        text: [
          { text: 'Fecha                  : ', style: 'letra12' },
          { text: `${fun_.my_dateFormater(data?.fecha || '')} - ${fun_.my_houreFormater(data?.fecha || '')}`, style: 'letra12' },
        ],
      },
    },
    {
      key: 'fecha_vencimiento',
      item: {
        alignment: 'left',
        text: [
          { text: 'Fecha vencimiento      : ', style: 'letra12' },
          { text: fun_.my_dateFormater(data?.fecha_vencimiento), style: 'letra12' },
        ],
      },
    },
    {
      key: 'ncf',
      item: {
        alignment: 'left',
        text: [
          { text: 'NCF                     : ', bold: true, style: 'letra12' },
          { text: data?.numero_comprobante || '', style: 'letra12' },
        ],
      },
    },
    {
      key: 'no_documento',
      item: {
        alignment: 'left',
        text: [
          { text: 'No. Documento : ', bold: true, style: 'letra12' },
          { text: fun_.my_padStart(data?.numero_documento || '', 8, '0'), style: 'letra12' },
        ],
      },
    },

    {
      key: 'valida',
      item: {
        alignment: 'left',
        text: [
          { text: 'Válida Hasta       : ', bold: true, style: 'letra12' },
          { text: data.tipo_factura_id === 3 ? 'No aplica.' : fun_.my_dateFormater(data?.fecha_valida), style: 'letra12' },
        ],
      },
    },
  ];

  partes.forEach((parte) => {
    if (infoFacturaPartes[tipo_pdf].includes(parte.key)) {
      parte.item['margin'] = [0, contenido.length ? 3 : 0, 0, 0];
      contenido.push(parte.item);
    }
  });

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
          is_suplidor ? { text: 'Suplidor               : ', bold: true, style: 'letra12' } : { text: 'Cliente                : ', bold: true, style: 'letra12' },
          is_suplidor ? { text: data?.suplidor.nombre || '', style: 'letra12' } : { text: `${data?.cliente.nombre || ''} ${data?.cliente.apellido || ''}`, style: 'letra12' },
        ],
      },
    },
    {
      key: 'doc_identidad',
      item: {
        alignment: 'left',
        text: [{ text: 'Doc. identidad   : ', bold: true, style: 'letra12' }, is_suplidor ? { text: data?.suplidor.rnc || '', style: 'letra12' } : { text: data?.cliente.rnc || '', style: 'letra12' }],
      },
    },
    {
      key: 'direccion',
      item: {
        alignment: 'left',
        text: [
          { text: 'Dirección            : ', bold: true, style: 'letra12' },
          is_suplidor ? { text: data?.suplidor.direccion || '', style: 'letra12' } : { text: data?.cliente.direccion || '', style: 'letra12' },
        ],
      },
    },
  ];

  partes.forEach((parte) => {
    if (infoPropietarioPartes[tipo_pdf].includes(parte.key)) {
      parte.item['margin'] = [0, contenido.length ? 3 : 0, 0, 0];
      contenido.push(parte.item);
    }
  });

  return contenido;
}
