/* eslint-disable @typescript-eslint/indent */
import * as _ from 'lodash';
import * as fun_ from '../../utils/funciones';
import { defaultStyle, styles_ } from '../../utils/files';
import { Ss } from '../../../singleton.service';
import { ConfigI } from '../../../../interface/config-interface';
import { getContentWithTablaNormal } from '../../utils/tabla_normal';
import { infoPropietarioPartes, infoFacturaPartes, cierrePdf, infoResumenPartes, infoTipoPdf, firmas, excludeFacturaPartesByTipoFactura } from './infoPdfs';
import { config_notas } from './configuraciones/notas/notas';
import { config_ventas } from './configuraciones/ventas';
import { config_recibo_ingreso } from './configuraciones/recibo_ingreso';
import { config_conduce } from './configuraciones/conduce';
import { config_cotizacion } from './configuraciones/cotizacion';
import { config_cuadre_caja } from './configuraciones/cuadre_caja';
import { fun } from '../../../functions.service';
import * as numLetra from '../../utils/numero_letras';
import { serie } from '@core/typescript/constantes';
import { agruparArticulosPorPagina, parseTotalizacion } from '../../utils/facturacion_electronica';
import { pageBreak } from '../../utils/funciones';

const configuraciones = {
  notas_detallada: config_notas.detallada,
  notas_agrupada: config_notas.agrupada,
  notas_electronica: config_notas.electronica,
  ventas: config_ventas,
  recibo_ingreso: config_recibo_ingreso,
  conduce: config_conduce,
  cotizacion: config_cotizacion,
  cuadre_caja: config_cuadre_caja,
};

export function makePDF(data, file_name, base_tipo_pdf?, post_tipo_pdf = '') {
  console.log('file_name ', file_name);
  console.log('base_tipo_pdf ', base_tipo_pdf);
  console.log('post_tipo_pdf ', post_tipo_pdf);

  const tipo_pdf = `${base_tipo_pdf}${post_tipo_pdf}`;
  console.log('tipo_pdf ', tipo_pdf);
  const is_compra = data?.tipo === 'compra' ? true : false;

  const is_suplidor = is_compra;
  const is_electronica = data?.serie == serie.electronica;

  const configApp: ConfigI = Ss.configServ.getConfig({ isPromise: false });
  const configuration = configuraciones[tipo_pdf];
  const pageO = configuration['pageOrient'] ? configuration['pageOrient'] : 'portrait';

  const dd = {
    pageSize: configuration.pageSize,
    pageMargins: configuration.pageMargins,
    header: (currentPage, pageCount, pageSize) => cabeceraPDF({ data, currentPage, pageCount, pageSize, is_suplidor, configApp, tipo_pdf: base_tipo_pdf, is_electronica }),
    content: contenidoPDF({ data, configApp, configuration, tipo_pdf: base_tipo_pdf, is_electronica }),
    footer: (currentPage, pageCount, pageSize) => pieFacturaVenta(data, is_electronica),
    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
      qrCodeImage: fun_.my_qrcode(data?.qr_url_dgii || ''),
    },
    styles: styles_,
    defaultStyle,
  };

  const obj = { doc: dd, file: file_name, type: 'file', pageOrientation: pageO };
  return obj;
}

// ==========================================================================================================================================================
// Cabecera
// ==========================================================================================================================================================
function cabeceraPDF(args: { data: any; currentPage: any; pageCount: any; pageSize: any; is_suplidor: boolean; configApp: ConfigI; tipo_pdf: any; is_electronica: boolean }) {
  const { data, currentPage, pageCount, pageSize, is_suplidor, configApp, tipo_pdf, is_electronica } = args;
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
          margin: [0, 5, 0, 0],
          columns: [
            { stack: parseInfoPropietario(data, tipo_pdf, is_suplidor), width: '*' },
            { stack: parseInfoFactura(data, tipo_pdf, is_electronica), width: 'auto' },
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

function contenidoPDF(args: { data: any; configApp: ConfigI; tipo_pdf: any; configuration: any; is_electronica: boolean }) {
  const { data, configApp, tipo_pdf, configuration, is_electronica } = args;

  let tabla_detalles = [];
  const totalizacion = parseTotalizacion(data.contenido_reporte);

  if (is_electronica) {
    tabla_detalles = processContenidoElectronico(configuration, data, is_electronica, tipo_pdf);
  } else {
    data.tipo_tabla = 'normal';
    tabla_detalles = getContentWithTablaNormal(configuration, data, is_electronica);
  }

  const content = [
    // ---------- TABLA ----------
    ...tabla_detalles,
    // ---------- DETALLE RESUMEN ----------
    {
      margin: [5, 2, 10, 0],
      stack: [
        {
          columns: [
            {
              layout: 'noBorders',
              table: {
                headerRows: 0,
                widths: ['*'],
                body: [
                  [
                    {
                      alignment: 'left',
                      text: [
                        { text: 'Realizado por: ', bold: true, style: 'letra10' },
                        { text: data?.usuario, style: 'letra10' },
                      ],
                    },
                  ],
                  configuration['mostrar_balance_cliente'] && data?.balance_cliente && data?.balance_cliente >= 1
                    ? [
                        {
                          alignment: 'left',
                          text: [
                            { text: 'Balance cliente: ', bold: true, style: 'letra10' },
                            { text: fun_.roundNumberToDecimal(data?.balance_cliente), style: 'letra10' },
                          ],
                        },
                      ]
                    : [{ text: '' }],
                  [
                    parseFirmasPdf({ tipo_pdf })
                  ],
                ],
              },
            },

            {
              layout: 'noBorders',
              table: {
                headerRows: 0,
                widths: ['*', 'auto'],
                body: [...parseResumen({ data, tipo_pdf, is_electronica, is_general: true, resumen_data: totalizacion })],
              },
            },
          ],
        },
      ],
    },
  ];

  // const detalle_resumen_stack = _.last(content);

  // detalle_resumen_stack.stack.push(parseFirmasPdf({ tipo_pdf }));

  // -------- BARCODE --------
  // if (cierrePdf['barcode'].includes(tipo_pdf)) detalle_resumen_stack.stack.push({ margin: [0, 20, 0, 0], image: 'barcode', width: 295, height: 70 } as any);

  return content;
}

function processContenidoElectronico(configuration, data, is_electronica, tipo_pdf) {
  const contenido = [];
  const _break = configuration.break;
  console.log('data ', data);

  const articulosAgrupados = agruparArticulosPorPagina(data.contenido_reporte, _break);

  articulosAgrupados.forEach((detalles_per_page, index) => {
    // const detalles = makeTableDetalles(detalles_per_page.articulos, is_venta, index * _break);
    const data_tabla = {
      tipo_tabla: 'normal',
      contenido_reporte: detalles_per_page.articulos,
    };

    const detalles = getContentWithTablaNormal(configuration, data_tabla, is_electronica);
    contenido.push(detalles);

    if (index < articulosAgrupados.length - 1) {
      contenido.push({
        columns: [
          { width: '*', stack: [] },
          {
            layout: 'noBorders',
            table: {
              headerRows: 0,
              widths: ['*', 'auto'],
              body: [...parseResumen({ data, tipo_pdf, is_electronica, is_general: false, resumen_data: detalles_per_page.totalizacion })],
            },
          },
        ],
      });
      contenido.push(pageBreak);
    }
  });

  return contenido;
}

function pieFacturaVenta(data, is_electronica) {
  return is_electronica ? getQRCode(data) : { text: '' };
}

function parseFirmasPdf(args: { tipo_pdf: any }) {
  const { tipo_pdf } = args;

  if (!firmas[tipo_pdf].length) return [{ text: '' }];

  const mainTable = { margin: [0, 30, 0, 0], table: { widths: [], body: [[]] } };

  const entidades = ['realizado_por', 'cliente', 'recibido_por', 'entregado_por'];

  entidades.forEach((entidad, index) => {
    if (firmas[tipo_pdf].includes(entidad)) {


      mainTable.table.widths.push(100);
      mainTable.table.body[0].push({ text: fun.Capitalice(entidad.split('_').join(' ')), alignment: 'center', style: 'letra10', border: [false, true, false, false] });

      if (index < firmas[tipo_pdf].length - 1) {
        mainTable.table.widths.push(20);
        mainTable.table.body[0].push({ text: '', border: [false, false, false, false] });
      }
    }
  });

  console.log('mainTable ', JSON.stringify(mainTable));
  

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
    {
      key: 'razon',
      item: [{ text: data?.razon, alignment: 'right', bold: false, style: 'letra10' }],
    },
  ];

  partes.forEach(parte => {
    if (infoTipoPdf[tipo_pdf].includes(parte.key)) {
      parte.item['margin'] = [0, contenido.length ? 2 : 15, 15, 0];
      contenido.push(parte.item);
    }
  });

  return contenido;
}

function parseResumen(args: { data: any; tipo_pdf: any; is_electronica: boolean; is_general: boolean; resumen_data?: any }) {
  const { data, tipo_pdf, is_electronica, is_general, resumen_data } = args;

  const resumen = [];
  if (!infoResumenPartes[tipo_pdf].length) return [{ text: '' }];

  const partes = [
    {
      key: 'total_excento',
      item: [
        { text: 'Total Excento', bold: true, alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(resumen_data?.total_excento || 0), alignment: 'right', style: 'letra10', bold: true },
      ],
    },
    {
      key: 'total_gravado',
      item: [
        { text: 'Total Gravado', bold: true, alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(resumen_data?.total_gravado || 0), alignment: 'right', style: 'letra10', bold: true },
      ],
    },
    {
      key: 'bruto',
      item: [
        { text: 'Total Excento', bold: true, alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(data?.Bruto || data?.bruto || 0), alignment: 'right', style: 'letra10', bold: true },
      ],
    },
    {
      key: 'itbis',
      item: [
        { text: 'Itbis', bold: true, alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(resumen_data?.itbis || data?.itbis || 0), alignment: 'right', style: 'letra10', bold: true },
      ],
    },
    {
      key: 'descuento',
      item: [
        { text: 'Descuento', bold: true, alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(resumen_data?.descuento || data?.descuento || 0), alignment: 'right', style: 'letra10', bold: true },
      ],
    },
    {
      key: 'mora',
      item: [
        { text: 'Mora', bold: true, alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(data?.mora || 0), bold: true, alignment: 'right', style: 'letra10' },
      ],
    },
    {
      key: 'total',
      item: [
        { text: 'Total', bold: true, alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(resumen_data?.total_pagina || data?.total || 0), alignment: 'right', style: 'letra10', bold: true },
      ],
    },
    {
      key: 'efectivo',
      item: [
        { text: 'Efectivo', bold: true, alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(data?.total + data?.devuelta || 0), bold: true, alignment: 'right', style: 'letra10' },
      ],
    },
    {
      key: 'cambio',
      item: [
        { text: 'Cambio', alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
        { text: fun_.roundNumberToDecimal(data?.devuelta || 0), alignment: 'right', style: 'letra10' },
      ],
    },
  ];

  partes.forEach(parte => {
    if (is_electronica) {
      const valor = parte.item[1].text;
      parte.item[0].text = `${parte.item[0].text} ${is_general ? '' : 'Página'} RD$ :`;
      // if (infoResumenPartes[tipo_pdf].includes(parte.key) && fun_.desformatearStNumber(valor) >= 1) resumen.push(parte.item);
      if (infoResumenPartes[tipo_pdf].includes(parte.key)) resumen.push(parte.item);
      
    } else {
      if (infoResumenPartes[tipo_pdf].includes(parte.key)) resumen.push(parte.item);
    }
  });

  return resumen;
}

function parseInfoFactura(data, tipo_pdf, is_electronica) {
  const contenido = [];
  if (!infoFacturaPartes[tipo_pdf].length) return [{ text: '' }];

  const partes = [
    {
      key: 'fecha',
      item: {
        alignment: 'left',
        noWrap: true,
        text: [
          { text: `${is_electronica ? 'Fecha Emisión' : 'Fecha factura'} : `, bold: true, style: 'letra10' },
          { text: `${fun_.my_dateFormater(data?.fecha || '')} ${is_electronica ? '' : `- ${fun_.my_houreFormater(data?.fecha || '')}`}`, style: 'letra10' },
        ],
      },
    },
    {
      key: 'fecha_vencimiento',
      item: {
        alignment: 'left',
        noWrap: true,
        text: [
          { text: 'Fecha limite pago: ', bold: true, style: 'letra10' },
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
          { text: `${data?.serie == serie.electronica ? 'eNCF' : 'NCF'} : `, bold: true, style: 'letra10' },
          { text: data?.numero_comprobante || '', style: 'letra10' },
        ],
      },
    },
    {
      key: 'ncf_modificado',
      item: {
        alignment: 'left',
        noWrap: true,
        text: [
          { text: `NCF modificado: `, bold: true, style: 'letra10' },
          { text: data?.ncf_modificado || '', style: 'letra10' },
        ],
      },
    },
    {
      key: 'no_documento',
      item: {
        alignment: 'left',
        noWrap: true,
        text: [
          { text: 'Doc No : ', bold: true, style: 'letra10' },
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
          { text: 'Fecha vencimiento: ', bold: true, style: 'letra10' },
          { text: data.tipo_factura_id === 3 ? 'No aplica.' : fun_.my_dateFormater(data?.fecha_valida), style: 'letra10' },
        ],
      },
    },
  ];

  partes.forEach(parte => {
    if (infoFacturaPartes[tipo_pdf].includes(parte.key) && (!('tipo_factura_id' in data) || (data?.tipo_factura_id && !excludeFacturaPartesByTipoFactura[parte.key]?.includes(data?.tipo_factura_id)))) {
      if (fun.hasValue(parte.item.text[1].text)) {
        parte.item['margin'] = [0, contenido.length ? 3 : 0, 0, 0];
        contenido.push(parte.item);
      }
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
          { text: `Razón Social ${is_suplidor ? 'Suplidor' : 'Cliente'}: `, bold: true, style: 'letra10' },
          is_suplidor ? { text: data?.suplidor.nombre || '', style: 'letra10' } : { text: `${data?.cliente.nombre || ''} ${data?.cliente.apellido || ''}`, style: 'letra10' },
        ],
      },
    },
    {
      key: 'doc_identidad',
      noWrap: true,
      item: {
        alignment: 'left',
        text: [{ text: `${is_suplidor ? 'RNC suplidor' : 'RNC cliente'} : `, bold: true, style: 'letra10' }, is_suplidor ? { text: data?.suplidor.rnc || '', style: 'letra10' } : { text: data?.cliente.rnc || '', style: 'letra10' }],
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

  partes.forEach(parte => {
    if (infoPropietarioPartes[tipo_pdf].includes(parte.key)) {
      parte.item['margin'] = [0, contenido.length ? 3 : 0, 0, 0];
      contenido.push(parte.item);
    }
  });

  return contenido;
}

function getQRCode(data) {
  const size = 58;
  return {
    margin: [15, 0, 0, 0],
    stack: [
      { image: 'qrCodeImage', width: size, height: size, margin: [0, 2, 0, 2] },
      {
        text: [
          { text: 'Código de Seguridad : ', style: 'letra9', bold: true },
          { text: data.security_code, style: 'letra9' },
        ],
      },
      {
        text: [
          { text: 'Fecha Firma : ', style: 'letra9', bold: true },
          { text: data.fecha_hora_firma, style: 'letra9' },
        ],
      },
    ],
  };
}
