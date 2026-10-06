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
  notas: config_notas.normal,
  notas_electronica: config_notas.electronica,
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
  const is_electronica = data?.serie == serie.electronica;
  
  const configApp: ConfigI = Ss.configServ.config;
  const configuration = getConfiguration(tipo_pdf, configApp);
  const pageO = configuration['pageOrient'] ? configuration['pageOrient'] : 'portrait';

  const dd = {
    pageSize: configuration.pageSize,
    pageMargins: configuration.pageMargins,
    header: (currentPage, pageCount, pageSize) => cabeceraPDF({ data, currentPage, pageCount, pageSize, is_suplidor, configApp, tipo_pdf: base_tipo_pdf, is_electronica }),
    content: contenidoPDF({ data, configApp, configuration, tipo_pdf: base_tipo_pdf, is_electronica }),
    footer: (currentPage, pageCount, pageSize) => pieFacturaVenta(data, is_electronica),
    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
      qrCodeImage: is_electronica ? fun_.my_qrcode(data?.qr_url_dgii || '') : '',
    },
    styles: styles_,
    defaultStyle,
  };

  const obj = { doc: dd, file: file_name, type: 'file', pageOrientation: pageO };
  return obj;
}

function getConfiguration(tipo_pdf: string, configApp: ConfigI) {
  const configuration = configuraciones[tipo_pdf];
  if (configApp?.usa_mora === true || tipo_pdf !== 'recibo_ingreso') return configuration;

  const moraIndexes = configuration.info.reduce((indexes, info, index) => {
    if (info.key === 'mora') indexes.push(index);
    return indexes;
  }, [] as number[]);

  return {
    ...configuration,
    widths: configuration.widths?.filter((_width, index) => !moraIndexes.includes(index)),
    info: configuration.info.filter(info => info.key !== 'mora'),
  };
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
              margin: [-50, 0, 0, 0],
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
    tabla_detalles = getContentWithTablaNormal({ configuration, data, is_electronica });
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
                  [parseFirmasPdf({ tipo_pdf })],
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

  const articulosAgrupados = agruparArticulosPorPagina(data.contenido_reporte, _break);

  articulosAgrupados.forEach((detalles_per_page, index) => {
    const data_tabla = { tipo_tabla: 'normal', contenido_reporte: detalles_per_page.articulos };

    const detalles = getContentWithTablaNormal({ configuration, data: data_tabla, is_electronica, offset: index * _break });
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
      mainTable.table.body[0].push({ text: fun.capitalice(entidad.split('_').join(' ')), alignment: 'center', style: 'letra10', border: [false, true, false, false] });

      if (index < firmas[tipo_pdf].length - 1) {
        mainTable.table.widths.push(20);
        mainTable.table.body[0].push({ text: '', border: [false, false, false, false] });
      }
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

  if (!infoResumenPartes[tipo_pdf].length) return [{ text: '' }];

  const componentesResumen = {
    total_excento: { label: 'Total Excento:', valor: resumen_data?.total_excento || 0 },
    total_gravado: { label: 'Total Gravado:', valor: resumen_data?.total_gravado || 0 },
    bruto: { label: 'Bruto:', valor: data?.Bruto || data?.bruto || 0 },
    itbis: { label: 'Itbis:', valor: resumen_data?.itbis || data?.itbis || 0 },
    descuento: { label: 'Descuento:', valor: resumen_data?.descuento || data?.descuento || 0 },
    mora: { label: 'Mora:', valor: data?.mora || 0 },
    total: { label: 'Total:', valor: resumen_data?.total_pagina || data?.total || 0 },
    efectivo: { label: 'Efectivo:', valor: data?.total + data?.devuelta || 0 },
    cambio: { label: 'Cambio:', valor: data?.devuelta || 0 },
  };

  const baseProps = {
    label: { bold: true, alignment: 'right', style: 'letra10', margin: [0, 0, 10, 0] },
    valor: { alignment: 'right', style: 'letra10', bold: true },
  };

  return infoResumenPartes[tipo_pdf]
    .filter(key => {
      const valor = fun_.roundNumberToDecimal(componentesResumen[key].valor);
      return fun_.desformatearStNumber(valor) >= 1;
    })
    .map(key => {
      const componente = componentesResumen[key];
      const textoLabel = is_electronica ? `${componente.label} ${is_general ? '' : 'Página'} RD$ :` : componente.label;

      return [
        { ...baseProps.label, text: textoLabel },
        { ...baseProps.valor, text: fun_.roundNumberToDecimal(componente.valor) },
      ];
    });
}

function parseInfoFactura(data, tipo_pdf, is_electronica) {
  if (!infoFacturaPartes[tipo_pdf].length) return [{ text: '' }];

  const partesConfig = {
    fecha: { label: `${is_electronica ? 'Fecha Emisión' : 'Fecha factura'} : `, valor: `${fun_.my_dateFormater(data?.fecha || '')} ${is_electronica ? '' : `- ${fun_.my_houreFormater(data?.fecha || '')}`}` },
    fecha_vencimiento: { label: 'Fecha limite pago: ', valor: fun_.my_dateFormater(data?.fecha_vencimiento) },
    ncf: { label: `${data?.serie == serie.electronica ? 'eNCF' : 'NCF'} : `, valor: data?.numero_comprobante || '' },
    ncf_modificado: { label: 'NCF modificado: ', valor: data?.ncf_modificado || '' },
    no_documento: { label: 'Doc No : ', valor: fun_.my_padStart(data?.numero_documento || '', 8, '0') },
    valida: { label: 'Fecha vencimiento: ', valor: data.tipo_factura_id === 3 ? 'No aplica.' : fun_.my_dateFormater(data?.fecha_valida) },
  };

  const baseProps = { alignment: 'left', noWrap: true };

  return infoFacturaPartes[tipo_pdf]
    .filter(key => (!('tipo_factura_id' in data) || (data?.tipo_factura_id && !excludeFacturaPartesByTipoFactura[key]?.includes(data?.tipo_factura_id))) && fun.hasValue(partesConfig[key].valor))
    .map((key, index) => ({
      ...baseProps,
      margin: [0, index ? 3 : 0, 0, 0],
      text: [
        { text: partesConfig[key].label, bold: true, style: 'letra10' },
        { text: partesConfig[key].valor, style: 'letra10' },
      ],
    }));
}

function parseInfoPropietario(data, tipo_pdf, is_suplidor) {
  if (!infoPropietarioPartes[tipo_pdf].length) return [{ text: '' }];

  const numero_letra = numLetra.NumeroALetras(data?.total);

  const propietario = is_suplidor ? data?.suplidor : data?.cliente;

  const max_length = 60;

  const evaluar_nombre = propietario.nombre_completo.length > max_length ? `${propietario.nombre_completo.substring(0, max_length)}...` : propietario.nombre_completo;

  const propietarioConfig = {
    nombre: { label: `Razón Social ${is_suplidor ? 'Suplidor' : 'Cliente'}: `, valor: fun.capitalice(evaluar_nombre) || '' },
    doc_identidad: { label: `${is_suplidor ? 'RNC suplidor' : 'RNC cliente'} : `, valor: propietario?.rnc ?? data?.NoCliente_rnc ?? '' },
    direccion: { label: 'Dirección: ', valor: propietario.direccion || '' },
    recibido: { label: 'Recibido: ', valorArray: [fun_.roundNumberToDecimal(data?.total), ` - ${fun_.my_capitalize(numero_letra)}`] },
  };

  const baseProps = { alignment: 'left', noWrap: true };

  return infoPropietarioPartes[tipo_pdf].map((key, index) => {
    const config = propietarioConfig[key];
    return {
      ...baseProps,
      margin: [0, index ? 3 : 0, 0, 0],
      text:
        key === 'recibido'
          ? [
              { text: config.label, bold: true, style: 'letra10' },
              { text: config.valorArray[0], style: 'letra10' },
              { text: config.valorArray[1], style: 'letra10' },
            ]
          : [
              { text: config.label, bold: true, style: 'letra10' },
              { text: config.valor, style: 'letra10' },
            ],
    };
  });
}

function getQRCode(data) {
  const size = 58;
  return {
    margin: [15, -15, 0, 0],
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
