/* eslint-disable @typescript-eslint/indent */
import * as _ from 'lodash';
import * as fun_ from '../../utils/funciones';
import { styles_ } from '../../utils/files';
import { Ss } from '../../../singleton.service';
import { ConfigI } from '../../../../interface/config-interface';
import { getContentWithTablaNormal } from '../../utils/tabla_normal';
import { infoPropietarioPartes, infoFacturaPartes, cierrePdf, infoResumenPartes, infoTipoPdf, firmas } from './infoPdfs';
import { config_notas } from './configuraciones/notas/notas';
import { config_ventas } from './configuraciones/ventas';
import { config_recibo_ingreso } from './configuraciones/recibo_ingreso';
import { config_conduce } from './configuraciones/conduce';
import { config_cotizacion } from './configuraciones/cotizacion';
import { config_cuadre_caja } from './configuraciones/cuadre_caja';
import { fun } from '../../../functions.service';
import * as numLetra from '../../utils/numero_letras';

const configuraciones = {
  notas_detallada: config_notas.detallada,
  notas_agrupada: config_notas.agrupada,
  ventas: config_ventas,
  recibo_ingreso: config_recibo_ingreso,
  conduce: config_conduce,
  cotizacion: config_cotizacion,
  cuadre_caja: config_cuadre_caja,
};

export function makePDF(data, file_name, base_tipo_pdf?, post_tipo_pdf = '') {
  const tipo_pdf = `${base_tipo_pdf}${post_tipo_pdf}`;
  const is_compra = data?.tipo === 'compra' ? true : false;

  const is_suplidor = is_compra;

  const configApp: ConfigI = Ss.configServ.getConfig({ isPromise: false });
  const configuration = configuraciones[tipo_pdf];
  const pageO = configuration['pageOrient'] ? configuration['pageOrient'] : 'portrait';

  const dd = {
    pageSize: configuration.pageSize,
    pageMargins: configuration.pageMargins,
    header: (currentPage, pageCount, pageSize) => cabeceraPDF({ data, currentPage, pageCount, pageSize, is_suplidor, configApp, tipo_pdf: base_tipo_pdf }),
    content: contenidoPDF({ data, configApp, configuration, tipo_pdf: base_tipo_pdf }),
    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
    },
    styles: styles_,
  };

  const obj = { doc: dd, file: file_name, type: 'file', pageOrientation: pageO };
  return obj;
}

// ==========================================================================================================================================================
// Cabecera
// ==========================================================================================================================================================
function cabeceraPDF(args: { data: any; currentPage: any; pageCount: any; pageSize: any; is_suplidor: boolean; configApp: ConfigI; tipo_pdf: any }) {
  const { data, currentPage, pageCount, pageSize, is_suplidor, configApp, tipo_pdf } = args;
  const header = [
    {
      margin: [15, 15, 15, 0],
      stack: [
        {
          columns: [
            {
              stack: [
                { text: 'pag: ' + currentPage.toString() + ' de ' + pageCount, alignment: 'left', style: 'letra9' },
                { image: 'logo', width: 50, height: 45, margin: [60, -15, 0, 0] },
              ],
              width: 'auto',
            },
            {
              stack: [
                { text: configApp.nombre_empresa, alignment: 'center', bold: true, style: 'letra11' },
                { text: configApp.direccion_empresa, alignment: 'center', style: 'letra10' },
                {
                  text: [
                    { text: 'Telefono: ', style: 'letra10' },
                    { text: configApp.telefono_empresa + ' ', style: 'letra10' },
                    { text: ' RNC: ', bold: true, style: 'letra10' },
                    { text: configApp.rnc_empresa, style: 'letra10' },
                  ],
                  alignment: 'center',
                },
              ],
              width: '*',
            },
            {
              stack: [parseTipoPdf(data, tipo_pdf)],
              width: 'auto',
            },
          ],
        },
        {
          margin: [0, 10, 0, 0],
          columns: [
            { stack: parseInfoPropietario(data, tipo_pdf, is_suplidor), width: '*' },
            { stack: parseInfoFactura(data, tipo_pdf), width: 'auto' },
          ],
        },
      ],
    },
  ];

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// ==========================================================================================================================================================

function contenidoPDF(args: { data: any; configApp: ConfigI; tipo_pdf: any; configuration: any }) {
  const { data, configApp, tipo_pdf, configuration } = args;

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
                { text: 'Realizado por: ', bold: true, style: 'letra10' },
                { text: data?.usuario, style: 'letra10' },
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

  detalle_resumen_stack.stack.push(parseFirmasPdf({ tipo_pdf }));

  // -------- BARCODE --------
  // if (cierrePdf['barcode'].includes(tipo_pdf)) detalle_resumen_stack.stack.push({ margin: [0, 20, 0, 0], image: 'barcode', width: 295, height: 70 } as any);

  return content;
}

function parseFirmasPdf(args: { tipo_pdf: any }) {
  const { tipo_pdf } = args;

  if (!firmas[tipo_pdf].length) return [{ text: '' }];

  const mainTable = { margin: [0, 40, 0, 0], layout: 'noBorders', table: { headerRows: 0, widths: [], body: [[]] } };

  const innerTabla = { table: { headerRows: 0, widths: [160], body: [] } };

  const entidades = ['realizado_por', 'cliente', 'recibido_por', 'entregado_por'];

  entidades.forEach((entidad, index) => {
    if (firmas[tipo_pdf].includes(entidad)) {
      const tabla_molde = fun.deepCloning(innerTabla);

      tabla_molde.table.body.push([{ text: fun.Capitalice(entidad.split('_').join(' ')), alignment: 'center', style: 'letra10', border: [false, true, false, false] }]);

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
      key: 'tipo_pdf',
      item: [{ text: data?.tipo_pdf, alignment: 'right', bold: true, style: 'letra10' }],
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
        { text: 'Bruto:', bold: true, alignment: 'right', style: 'letra11', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(data?.Bruto), alignment: 'right', style: 'letra11', bold: true },
      ],
    },
    {
      key: 'itbis',
      item: [
        { text: 'Itbis:', bold: true, alignment: 'right', style: 'letra11', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(data?.itbis), alignment: 'right', style: 'letra11', bold: true },
      ],
    },
    {
      key: 'descuento',
      item: [
        { text: 'Descuento:', bold: true, alignment: 'right', style: 'letra11', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(data?.descuento), alignment: 'right', style: 'letra11', bold: true },
      ],
    },
    {
      key: 'total',
      item: [
        { text: 'Total:', bold: true, alignment: 'right', style: 'letra11', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(data?.total), alignment: 'right', style: 'letra11', bold: true },
      ],
    },
    {
      key: 'efectivo',
      item: [
        { text: 'Efectivo', bold: true, alignment: 'right', style: 'letra11', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(data?.total + data?.devuelta), bold: true, alignment: 'right', style: 'letra11' },
      ],
    },
    {
      key: 'cambio',
      item: [
        { text: 'Cambio', alignment: 'right', style: 'letra11', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(data?.devuelta), alignment: 'right', style: 'letra11' },
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
        noWrap: true,
        text: [
          { text: 'Fecha: ', bold: true, style: 'letra10' },
          { text: `${fun_.my_dateFormater(data?.fecha || '')} - ${fun_.my_houreFormater(data?.fecha || '')}`, style: 'letra10' },
        ],
      },
    },
    {
      key: 'fecha_vencimiento',
      item: {
        alignment: 'left',
        noWrap: true,
        text: [
          { text: 'Fecha vencimiento: ', bold: true, style: 'letra10' },
          { text: fun_.my_dateFormater(data?.fecha_vencimiento), style: 'letra10' },
        ],
      },
    },
    {
      key: 'ncf',
      item: {
        alignment: 'left',
        noWrap: true,
        text: [
          { text: 'NCF: ', bold: true, style: 'letra10' },
          { text: data?.numero_comprobante || '', style: 'letra10' },
        ],
      },
    },
    {
      key: 'no_documento',
      item: {
        alignment: 'left',
        noWrap: true,
        text: [
          { text: 'No. Documento: ', bold: true, style: 'letra10' },
          { text: fun_.my_padStart(data?.numero_documento || '', 8, '0'), style: 'letra10' },
        ],
      },
    },

    {
      key: 'valida',
      item: {
        alignment: 'left',
        noWrap: true,
        text: [
          { text: 'Válida Hasta: ', bold: true, style: 'letra10' },
          { text: data.tipo_factura_id === 3 ? 'No aplica.' : fun_.my_dateFormater(data?.fecha_valida), style: 'letra10' },
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
  const numero_letra = numLetra.NumeroALetras(data?.total);
  if (!infoPropietarioPartes[tipo_pdf].length) return [{ text: '' }];

  const partes = [
    {
      key: 'nombre',
      item: {
        alignment: 'left',
        noWrap: true,
        text: [
          is_suplidor ? { text: 'Suplidor: ', bold: true, style: 'letra10' } : { text: 'Cliente: ', bold: true, style: 'letra10' },
          is_suplidor ? { text: data?.suplidor.nombre || '', style: 'letra10' } : { text: `${data?.cliente.nombre || ''} ${data?.cliente.apellido || ''}`, style: 'letra10' },
        ],
      },
    },
    {
      key: 'doc_identidad',
      noWrap: true,
      item: {
        alignment: 'left',
        text: [{ text: 'Doc. identidad : ', bold: true, style: 'letra10' }, is_suplidor ? { text: data?.suplidor.rnc || '', style: 'letra10' } : { text: data?.cliente.rnc || '', style: 'letra10' }],
      },
    },
    {
      key: 'direccion',
      noWrap: true,
      item: {
        alignment: 'left',
        text: [{ text: 'Dirección: ', bold: true, style: 'letra10' }, is_suplidor ? { text: data?.suplidor.direccion || '', style: 'letra10' } : { text: data?.cliente.direccion || '', style: 'letra10' }],
      },
    },
    {
      key: 'recibido',
      item: {
        alignment: 'left',
        text: [
          { text: 'Recibido: ', bold: true, style: 'letra10' },
          { text: fun_.roundNumberToDecimal(data?.total), style: 'letra10' },
          { text: ` - ${fun_.my_capitalize(numero_letra)}`, style: 'letra10' },
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
