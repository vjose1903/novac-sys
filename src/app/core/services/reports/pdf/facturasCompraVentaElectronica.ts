/* eslint-disable @typescript-eslint/indent */
import * as fun_ from '../utils/funciones';
import { defaultStyle, styles_ } from '../utils/files';
import * as numLetra from '../utils/numero_letras';
import { Ss } from '../../singleton.service';
import { ConfigI } from '../../../interface/config-interface';
import { agruparArticulosPorPagina, parseTotalizacion } from '../utils/facturacion_electronica';
import { infoPagare } from './8.5x5.5/infoPdfs';
import { pageBreak } from '../utils/funciones';
import { fun } from '@core/services/functions.service';

// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================
function getPageMargin(is_contado) {
  let margins = [];

  if (is_contado) {
    margins = [15, 135, 15, 80];
  } else {
    margins = [15, 148.6, 15, 80];
  }

  return margins;
}

function escapeSvgText(value: unknown) {
  return `${value ?? ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

const tableColumnsWidth = [15, 190, 60, 60, 60, 60, 70];

export function makePDF(data, file_name, base_tipo_pdf?, post_tipo_pdf = '') {
  const is_venta = data.tipo === 'venta' ? true : false;
  const is_contado = data.condicion === 'Contado' ? true : false;

  const configApp: ConfigI = Ss.configServ.config;

  const dd = {
    pageSize: is_contado ? { width: 600, height: 398 } : { width: 600, height: 796 },
    pageMargins: getPageMargin(is_contado),
    header: (currentPage, pageCount, pageSize) => cabeceraFacturaVenta(data, is_contado, is_venta, currentPage, pageCount, configApp),
    content: processContenidoFactura(data, is_contado, is_venta, configApp),
    footer: (currentPage, pageCount, pageSize) => pieFacturaVenta(data),
    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
      qrCodeImage: fun_.my_qrcode(data?.qr_url_dgii || ''),
    },
    styles: styles_,
    defaultStyle,
  };

  const obj = { doc: dd, file: file_name, type: 'file', pageOrientation: 'portrait' };

  return obj;
}

// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraFacturaVenta(data, is_contado, is_venta, currentPage, pageCount, configApp: ConfigI) {
  const header = [
    {
      margin: [15, 15, 15, 0],
      stack: [
        {
          columns: [
            [
              { text: 'pag: ' + currentPage.toString() + ' de ' + pageCount, alignment: 'left', style: 'letra9' },
              { image: 'logo', width: 50, height: 45, margin: [60, -15, 0, 0] },
            ],
            [
              { text: 'FACTURA A ' + data.condicion.toUpperCase(), alignment: 'right', bold: true, style: 'letra10' },
              { text: data.tipo_pdf, style: 'letra9', alignment: 'right' },
            ],
          ],
        },
        {
          margin: [-80, -40, 0, 0],
          stack: [
            { text: configApp.nombre_empresa, alignment: 'center', bold: true, style: 'letra11' },
            { text: configApp.direccion_empresa, alignment: 'center', style: 'letra10' },
            {
              text: [
                { text: 'Telefono: ', bold: true, style: 'letra10' },
                { text: `${configApp.telefono_empresa} `, style: 'letra10' },
                { text: ' RNC: ', bold: true, style: 'letra10' },
                { text: configApp.rnc_empresa, style: 'letra10' },
              ],
              alignment: 'center',
            },
          ],
        },

        {
          margin: [0, 10, 0, 0],
          text: [
            {
              text: [
                is_venta ? { text: 'Razón Social Cliente : ', style: 'letra10' } : { text: ' Razón Social Suplidor : ', style: 'letra10' },
                is_venta ? { text: data.cliente.nombre_completo, style: 'letra10' } : { text: data.suplidor.nombre_completo, style: 'letra10' },
              ],
            },
          ],
        },

        {
          text: [{ text: `RNC ${is_venta ? 'cliente' : 'suplidor'} : `, style: 'letra10' }, is_venta ? { text: data.cliente.rnc, style: 'letra10' } : { text: data.suplidor.rnc, style: 'letra10' }],
          margin: [0, 4, 0, 0],
        },

        {
          margin: [0, 4, 0, 0],
          text: [
            {
              text: [{ text: 'Dirección : ', style: 'letra10' }, is_venta ? { text: data.cliente.direccion, style: 'letra10' } : { text: data.suplidor.direccion, style: 'letra10' }],
            },
          ],
        },

        {
          margin: [420, -40, 0, 0],
          stack: [
            {
              text: [
                { text: 'Fecha Emisión: ', style: 'letra10' },
                { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra10' },
              ],
              margin: [0, -10, 0, 0],
            },
            is_contado
              ? { text: '' }
              : {
                  text: [
                    { text: 'Fecha limite pago : ', style: 'letra10' },
                    { text: fun_.my_dateFormater(data.fecha_vencimiento), style: 'letra10' },
                  ],
                  margin: [0, 3, 0, 0],
                },
            {
              text: [
                { text: 'eNCF : ', style: 'letra10' },
                { text: data.numero_comprobante, style: 'letra10' },
              ],
              margin: [0, 3, 0, 0],
            },
            {
              text: [
                { text: 'Doc No : ', style: 'letra10' },
                { text: fun_.my_padStart(data.numero_documento, 8, '0'), style: 'letra10' },
              ],
              margin: [0, 3, 0, 0],
            },

            {
              text: [
                { text: 'Fecha vencimiento : ', style: 'letra10' },
                data.tipo_factura_id == 23 ? { text: 'No aplica.', style: 'letra10' } : data.tipo === 'compra' ? { text: ' ' } : { text: fun_.my_dateFormater(data.fecha_valida), style: 'letra10' },
              ],
              margin: [0, 3, 0, 3],
            },
          ],
        },
        {
          table: {
            margin: [0, 0, 0, 0],
            headerRows: 1,
            widths: tableColumnsWidth,
            body: [
              [
                { text: ' #', style: 'letra10', bold: true, alignment: 'center', margin: [4, 0, 0, 0] },
                { text: 'Articulo', style: 'letra10', bold: true, margin: [0, 0, 0, 0], unbreakable: true },
                { text: 'Cantidad', style: 'letra10', bold: true, alignment: 'right', margin: [0, 0, 0, 0], unbreakable: true },
                is_venta ? { text: 'Precio', style: 'letra10', bold: true, alignment: 'right', margin: [0, 0, 0, 0] } : { text: 'Costo', style: 'letra10', bold: true, alignment: 'right', margin: [0, 0, 0, 0] },
                { text: 'Itbis', style: 'letra10', bold: true, alignment: 'right', margin: [0, 0, 0, 0] },
                { text: 'Descuento', style: 'letra10', bold: true, alignment: 'right', margin: [0, 0, 0, 0] },
                { text: 'Total', style: 'letra10', bold: true, alignment: 'right', margin: [0, 0, 0, 0] }, // margin: [12, 0, 0, 0]
              ],

              [1, 'Sample value 1', '100.00 UND.', '9,999.99', '0.00', '9,999.99', '999,999.99'],
            ],
          },
          layout: {
            hLineWidth: (i, node) => 1,
            vLineWidth: (i, node) => 0,
            hLineColor: (i, node) => 'black',
            vLineColor: (i, node) => 'white',
          },
        },
      ],
    },
  ];

  return header;
}

// ==========================================================================================================================================================
// PIE
// ==========================================================================================================================================================
function pieFacturaVenta(data) {
  return getQRCode(data);
}

// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================
function processContenidoFactura(data, is_contado, is_venta, configApp: ConfigI) {
  const contenido = [];
  const _break = is_contado ? 5 : 14;
  const articulosAgrupados = agruparArticulosPorPagina(data.detalle_facturas, _break);

  articulosAgrupados.forEach((detalles_per_page, index) => {
    const detalles = makeTableDetalles(detalles_per_page.articulos, is_venta, index * _break);
    contenido.push(detalles);

    if (index < articulosAgrupados.length - 1) {
      contenido.push({
        columns: [
          { width: '*', stack: [] },
          tableTotalizacion({
            is_general: false,
            total_excento: detalles_per_page.totalizacion.total_excento,
            total_gravado: detalles_per_page.totalizacion.total_gravado,
            itbis: detalles_per_page.totalizacion.itbis,
            total_factura: detalles_per_page.totalizacion.total_pagina,
          }),
        ],
      });
      contenido.push(pageBreak);
    }
  });

  return [...contenido, ...afterContent(data, is_contado, is_venta, configApp)];
}

function makeTableDetalles(detalles_per_page, is_venta, offset) {
  const tableTemplate = {
    table: {
      widths: tableColumnsWidth,
      body: [],
    },
    margin: [0, -4, 0, 0],
    layout: {
      hLineWidth: (i, node) => 1,
      vLineWidth: (i, node) => 0,
      hLineColor: (i, node) => (i == node.table.body.length ? 'black' : 'gray'),
      vLineColor: (i, node) => 'white',
    },
  };

  detalles_per_page.forEach((detalle, i) => {
    const row = [];

    const raw_descripcion = detalle.descripcion.trim();
    const max_longitud_descripcion = 26;
    const longitud_descripcion = raw_descripcion.length;
    const descripcion = longitud_descripcion > max_longitud_descripcion ? `${raw_descripcion.slice(0, max_longitud_descripcion)}` : raw_descripcion;

    row.push(
      { text: offset + i + 1, style: 'letra10', alignment: 'center' },
      { text: `${descripcion} ${detalle.calcular_itbis ? '' : '- E'}`, style: 'monospace10', margin: [0, -1, 0, 0] },
      { text: detalle.cantidad, style: 'letra10', alignment: 'right', margin: [0, 0, 0, 0] },
      {
        text: fun_.roundNumberToDecimal(is_venta ? detalle.precio : detalle.costo),
        style: 'letra10',
        alignment: 'right',
        margin: [0, 0, 0, 0],
      },
      { text: fun_.roundNumberToDecimal(detalle.itbis), style: 'letra10', alignment: 'right', margin: [0, 0, 0, 0] },
      { text: fun_.roundNumberToDecimal(detalle.descuento_valor), style: 'letra10', alignment: 'right', margin: [0, 0, 0, 0] },
      { text: fun_.roundNumberToDecimal(detalle.total), style: 'letra10', alignment: 'right', margin: [0, 0, 0, 0] }
    );
    tableTemplate.table.body.push(row);
  });

  return tableTemplate;
}

function tableTotalizacion(args: { is_general: boolean; total_excento: number; total_gravado: number; itbis: number; total_factura: number; descuento?: number }) {
  const { is_general, total_excento, total_gravado, itbis, total_factura, descuento } = args;

  const parts = [
    { key: 'total_excento', text: 'Subtotal Excento', value: total_excento },
    { key: 'total_gravado', text: 'Subtotal Gravado', value: total_gravado },
    { key: 'itbis', text: 'Total Itbis', value: itbis },
    { key: 'descuento', text: 'Descuento', value: descuento },
    { key: 'total_factura', text: 'Total', value: total_factura },
  ];

  const keys_summary = ['total_excento', 'total_gravado', 'itbis', 'total_factura'];

  const template = {
    width: 'auto',
    margin: [0, 0, 2, 0],
    table: { widths: ['*', 'auto'], body: [] },
    layout: 'noBorders',
  };

  template.table.body = parts.reduce((acc, part) => {
    if ((!is_general && !keys_summary.includes(part.key)) || fun.isEmpty(part.value) || part.value < 1) {
      return acc;
    } else {
      acc.push([
        { text: `${part.text}${is_general ? '' : ' Página'} RD$ :`, style: 'letra10', bold: true, alignment: 'right' },
        { text: fun_.roundNumberToDecimal(part.value), style: 'letra10', alignment: 'right' },
      ]);

      return acc;
    }
  }, []);

  return template;
}

function afterContent(data, is_contado, is_venta, configApp: ConfigI) {
  const numero_letra = numLetra.NumeroALetras(data.total_factura);
  const svgNombreEmpresa = escapeSvgText(configApp.nombre_empresa);
  const svgDireccionEmpresa = escapeSvgText(configApp.direccion_empresa);
  const svgTelefonoEmpresa = escapeSvgText(configApp.telefono_empresa);
  const svgRncEmpresa = escapeSvgText(configApp.rnc_empresa);
  const svgNumeroLetra = escapeSvgText(numero_letra);
  const svgNombreCliente = escapeSvgText(data.cliente?.nombre);

  const totalizacion = parseTotalizacion(data.detalle_facturas);

  const content = [
    {
      columns: [
        {
          width: '*',
          stack: [
            {
              margin: [0, 2, 0, 0],
              text: [
                { text: 'Realizada Por :  ', style: 'letra10', bold: true },
                { text: data.usuario, style: 'letra10' },
                // vendedor
                data.vendedor ? { text: '    Vendedor :  ', style: 'letra10', bold: true } : { text: '' },
                data.vendedor ? { text: data.vendedor, style: 'letra10' } : { text: '' },
              ],
            },
            formatMovimientosViajes(data),
            is_venta && !is_contado
              ? { text: '' }
              : {
                  margin: [100, 30, 0, 0],
                  table: {
                    widths: [100, 20, 100],
                    body: [
                      [
                        { text: 'Revisada Por', style: 'letra10', bold: true, alignment: 'center', border: [false, true, false, false] },
                        { text: '', border: [false, false, false, false] },
                        { text: 'Cliente', style: 'letra10', bold: true, alignment: 'center', border: [false, true, false, false] },
                      ],
                    ],
                  },
                },
          ],
        },
        tableTotalizacion({ is_general: true, total_excento: totalizacion.total_excento, total_gravado: totalizacion.total_gravado, itbis: data.itbis, total_factura: data.total_factura, descuento: data.descuento }),
      ],
    },
    {
      stack: [
        is_venta
          ? !is_contado
            ? {
                stack: [
                  {
                    text: '======================================================================================',
                  },
                  {
                    columns: [
                      {
                        margin: [0, 5, 0, 0],
                        stack: [
                          {
                            svg: `<svg viewBox="0 0 700 180">
                            <rect height="180" width="43" fill="#ffffff" rx="5" ry="5" x="0" y="0" stroke="black" />
                            <text transform="translate(11, ${infoPagare[configApp.cliente].altura_nombre}) rotate(-90)" font-weight="bold" style="font-size: 8.5px" > ${svgNombreEmpresa} </text>
                            <text transform="translate(23, ${infoPagare[configApp.cliente].altura_direccion}) rotate(-90)" style="font-size: 8.5"> ${svgDireccionEmpresa} </text>
                            <text transform="translate(35, 176) rotate(-90)" font-weight="bold" style="font-size: 8.5" > Telefono: </text>
                            <text transform="translate(35, 137) rotate(-90)" style="font-size: 8.5"> ${svgTelefonoEmpresa} - </text>
                            <text transform="translate(35, 73) rotate(-90)" font-weight="bold" style="font-size: 8.5" > Rnc: </text>
                            <text transform="translate(35, 55) rotate(-90)" style="font-size: 8.5"> ${svgRncEmpresa} </text>
                          </svg>`,
                          },
                        ],
                      },
                      {
                        margin: [-650, 5, 0, 0],
                        stack: [
                          {
                            svg: `<svg viewBox="0 0 950 180">
                              <rect height="180" width="517" fill="#ffffff" rx="5" ry="5" x="0" y="0" stroke="black" />

                              <text transform="translate(8, 15)" style="font-size: 7px" >DESPUÉS DE LA FECHA DE VENCIMIENTO DE ESTA FACTURA </text>
                              <text transform="translate(8, 25)" style="font-size: 7px" > QUE SON 30 DÍAS, SE GENERARÁ UN 2% DE MORA</text>

                              <text transform="translate(250, 20)" style="font-size: 12px" font-weight="bold">Unica de Cambio </text>

                              <text transform="translate(420, 20)" font-weight="bold" style="font-size: 10px" > Fecha: </text>
                              <text transform="translate(450, 20)" style="font-size: 10px"> ${fun_.my_dateFormater(data.fecha_equivalente)} </text>


                              <text transform="translate(8, 40)" style="font-size: 9px"> Debo y pagaré a  </text>
                              <text transform="translate(83 40)" style="font-size: 9px" font-weight="bold"> ${svgNombreEmpresa} </text>
                              <text transform="translate(${configApp.nombre_empresa.length * 6.5}, 40)" style="font-size: 9px"> la cantidad de :  </text>

                              <text transform="translate(8, 55)" style="font-size: 10px" font-weight="bold">** ${svgNumeroLetra} **</text>

                              <text transform="translate(8, 67)" style="font-size: 9px"> Valor recibido a mi (nuestra) entera satisfacción segun la</text>
                              <text transform="translate(240, 67)" style="font-size: 9px" font-weight="bold"> Factura No. ${fun_.my_padStart(data.numero_documento, 8, '0')}</text>
                              <text transform="translate(335, 67)" style="font-size: 9px"> para el fiel cumplimiento del pago quedan</text>
                              <text transform="translate(8, 78)" style="font-size: 9px"> afectados mis (nuestros) bienes habidos y por haber, con renuncia de fuero de domicilio y de cualquier otra que puediera </text>
                              <text transform="translate(8, 90)" style="font-size: 9px">  favorecerme (nos).</text>


                              <text transform="translate(8, 106)" style="font-size: 9px" font-weight="bold"> A: </text>
                              <text transform="translate(25, 106)" style="font-size: 12px" font-weight="bold"> ${svgNombreCliente} </text>
                              <line x1="20" y1="110" x2="500" y2="110" style="stroke:#000000;stroke-width:1" />

                              <text transform="translate(8, 128)" style="font-size: 9px" font-weight="bold"> RD$ </text>
                              <rect height="20" width="200" fill="#ffffff" rx="0" ry="5" x="40" y="115" stroke="black" />
                              <text transform="translate(50, 128)" style="font-size: 12px" font-weight="bold"> ${fun_.roundNumberToDecimal(data.total_factura)} </text>

                              <line x1="30" y1="163" x2="165" y2="163" style="stroke:#000000;stroke-width:1" />
                              <text transform="translate(75, 174)" style="font-size: 9px" >Nombre</text>

                              <line x1="180" y1="163" x2="315" y2="163" style="stroke:#000000;stroke-width:1" />
                              <text transform="translate(230, 174)" style="font-size: 9px" >Cedula</text>

                              <line x1="330" y1="163" x2="465" y2="163" style="stroke:#000000;stroke-width:1" />
                              <text transform="translate(345, 174)" style="font-size: 9px" >Firma Autorizada / Sello</text>

                            </svg>`,
                          },
                        ],
                      },
                    ],
                  },
                ],
                margin: [0, 10, 0, 0],
              }
            : { text: '' }
          : { text: '' },
      ],
      unbreakable: true,
    },
    // -----------------------
  ];
  return content;
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

function formatMovimientosViajes(data) {
  if (!data.is_viaje) return [{ text: '' }];

  const movimientosRows = [];

  data.movimientos_viaje.forEach(movimiento => {
    movimientosRows.push([
      {
        // camión
        text: [
          { text: 'Camión: ', style: 'letra10', bold: true },
          { text: movimiento.vehiculo.info_vehiculo, style: 'letra10' },
        ],
      },
      {
        // chofer
        text: [
          { text: 'Chofer: ', style: 'letra10', bold: true },
          { text: movimiento.chofer.nombre_completo, style: 'letra10' },
        ],
      },
    ]);
  });

  const tableMovimientos = {
    table: {
      widths: ['auto', 'auto'],
      body: movimientosRows,
    },
    layout: 'noBorders',
  };

  return tableMovimientos;
}
