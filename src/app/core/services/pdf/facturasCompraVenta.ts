/* eslint-disable @typescript-eslint/indent */
import * as fun_ from './utils/funciones';
import { styles_ } from './utils/files';
import * as numLetra from './utils/numero_letras';
import { SingletonService } from '../singleton.service';
import { ConfigI } from '../../typescript/config-interface';
import { infoPagare } from './8.5x5.5/infoPdfs';
// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================
function getPageMargin(is_contado) {
  let margins = [];

  if (is_contado) {
    // margins = [15, 158, 15, 30];
    margins = [15, 126, 15, 30];
  } else {
    margins = [15, 174, 15, 30];
  }

  return margins;
}

export function makePDF(data, file_name, base_tipo_pdf?, post_tipo_pdf = '') {
  const is_venta = data.tipo === 'venta' ? true : false;
  const is_contado = data.condicion === 'Contado' ? true : false;

  const configApp: ConfigI = SingletonService.configServ.getConfig({ isPromise: false });

  const dd = {
    pageSize: is_contado ? { width: 600, height: 398 } : { width: 600, height: 796 },
    pageMargins: getPageMargin(is_contado),
    header: (currentPage, pageCount, pageSize) => {
      return cabeceraFacturaVenta(data, is_contado, is_venta, currentPage, pageCount, configApp);
    },
    content: contenidoFacturaVenta(data, is_contado, is_venta, configApp),
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
function cabeceraFacturaVenta(data, is_contado, is_venta, currentPage, pageCount, configApp: ConfigI) {
  const header = [
    {
      margin: [15, 15, 15, 0],
      stack: [
        {
          columns: [
            [
              { text: 'pag: ' + currentPage.toString() + ' de ' + pageCount, alignment: 'left', style: 'letra9' },
              { image: 'logo', width: 50, height: 45, margin: [70, -15, 0, 0] },
            ],
            [
              { text: 'FACTURA A ' + data.condicion.toUpperCase(), alignment: 'right', bold: true, style: 'letra10' },
              { text: data.tipo_pdf, style: 'letra10', alignment: 'right' },
            ],
          ],
        },
        {
          margin: [0, -40, 0, 0],
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
              text: [is_venta ? { text: 'Cliente : ', style: 'letra10' } : { text: 'Suplidor : ', style: 'letra10' }, is_venta ? { text: data.cliente.nombre, style: 'letra10' } : { text: data.suplidor.nombre, style: 'letra10' }],
            },
          ],
        },

        {
          text: [is_venta ? { text: 'Rnc cliente : ', style: 'letra10' } : { text: 'Rnc suplidor : ', style: 'letra10' }, is_venta ? { text: data.cliente.rnc, style: 'letra10' } : { text: data.suplidor.rnc, style: 'letra10' }],
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
          margin: [350, -40, 0, 0],
          stack: [
            {
              text: [
                { text: 'Fecha : ', style: 'letra9' },
                { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra9' },
                { text: ' - ' + fun_.my_houreFormater(data.fecha_equivalente), style: 'letra9' },
              ],
              margin: [85, -10, 0, 0],
            },
            is_contado
              ? { text: '' }
              : {
                  text: [
                    { text: 'Fecha vencimiento : ', style: 'letra9' },
                    { text: fun_.my_dateFormater(data.fecha_vencimiento), style: 'letra9' },
                  ],
                  margin: [85, 3, 0, 0],
                },
            {
              text: [
                { text: 'NCF : ', style: 'letra9' },
                { text: data.numero_comprobante, style: 'letra9' },
              ],
              margin: [85, 3, 0, 0],
            },
            {
              text: [
                { text: 'Doc No : ', style: 'letra9' },
                { text: fun_.my_padStart(data.numero_documento, 8, '0'), style: 'letra9' },
              ],
              margin: [85, 3, 0, 0],
            },
            {
              text: [{ text: 'Valida hasta : ', style: 'letra9' }, data.tipo_factura_id == 3 ? { text: 'No aplica.', style: 'letra9' } : data.tipo === 'compra' ? { text: ' ' } : { text: fun_.my_dateFormater(data.fecha_valida), style: 'letra9' }],
              margin: [85, 3, 0, 0],
            },
          ],
        },
        {
          table: {
            headerRows: 1,
            widths: [20, 230, '*', '*', '*', '*'],
            body: [
              [
                { text: ' #', style: 'letra11', bold: true, alignment: 'center', margin: [4, 0, 0, 0] },
                { text: 'Articulo', style: 'letra11', bold: true, margin: [-5, 0, 0, 0] },
                { text: 'Cantidad', style: 'letra11', bold: true, alignment: 'right', margin: [0, 0, 5, 0] },
                is_venta ? { text: 'Precio', style: 'letra11', bold: true, alignment: 'right', margin: [0, 0, 17, 0] } : { text: 'Costo', style: 'letra11', bold: true, alignment: 'right', margin: [0, 0, 18, 0] },
                { text: 'Itbis', style: 'letra11', bold: true, alignment: 'right', margin: [0, 0, 17, 0] },
                { text: 'Total', style: 'letra11', bold: true, alignment: 'right', margin: [0, 0, 18, 0] }, // margin: [12, 0, 0, 0]
              ],

              [1, 'Sample value 1', 'value 2', 'value 4', 'value 5', 'value 6'],
            ],
          },
          margin: [0, 0, 0, 0],
          layout: {
            hLineWidth: (i, node) => 1,
            vLineWidth: (i, node) => 0,
            hLineColor: (i, node) => 'black',
            // hLineColor: (i, node) => 'red',
            vLineColor: (i, node) => 'white',
          },
        },
      ],
    },
  ];

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================
function contenidoFacturaVenta(data, is_contado, is_venta, configApp: ConfigI) {
  const tempBody = [];
  const _break = is_contado ? 10 : 26;

  data.contenido_reporte.forEach((detalle, i) => {
    const row = [];
    const br_ = i !== 0 && i % _break === 0;

    row.push(
      { text: i + 1, style: 'letra10', alignment: 'center', pageBreak: br_ ? 'before' : 'none' },
      { text: detalle.descripcion, style: 'letra10', pageBreak: br_ ? 'before' : 'none' },
      { text: detalle.cantidad, style: 'letra10', alignment: 'right', margin: [0, 0, 0, 0], pageBreak: br_ ? 'before' : 'none' },
      {
        text: fun_.numFormatTwoDecimals(is_venta ? detalle.precio : detalle.costo),
        style: 'letra10',
        alignment: 'right',
        margin: [0, 0, 14, 0],
        pageBreak: br_ ? 'before' : 'none',
      },
      { text: fun_.numFormatTwoDecimals(detalle.itbis), style: 'letra10', alignment: 'right', margin: [0, 0, 15, 0], pageBreak: br_ ? 'before' : 'none' },
      { text: fun_.numFormatTwoDecimals(detalle.total), style: 'letra10', alignment: 'right', margin: [0, 0, 15, 0], pageBreak: br_ ? 'before' : 'none' },
    );
    tempBody.push(row);
  });

  const numero_letra = numLetra.NumeroALetras(data.total_factura);

  const content = [
    {
      table: {
        widths: [20, 225, '*', '*', '*', '*'],
        body: tempBody,
      },
      margin: [0, -2, 0, 0],
      layout: {
        hLineWidth: (i, node) =>  i % _break == 0 && node.table.body.length != _break ? 0 : 1,
        // hLineWidth: (i, node) =>  i % _break == 0 && node.table.body.length != _break ? 0 : i == node.table.body.length ? 2 : 1,
        vLineWidth: (i, node) => 0,
        hLineColor: (i, node) =>  i == node.table.body.length ? 'black' : 'gray',
        vLineColor: (i, node) => 'white',
      },
    },
    {
      text: [
        { text: 'Realizada Por :  ', style: 'letra10', bold: true },
        { text: data.usuario, style: 'letra10' },
        data.vendedor ? { text: '    Vendedor :  ', style: 'letra10', bold: true } : { text: '' },
        data.vendedor ? { text: data.vendedor, style: 'letra10' } : { text: '' },
      ],
      margin: [0, 5, 0, 0],
    },
    // -----------------------
    {
      stack: [
        {
          columns: [
            is_venta && !is_contado
              ? { text: '' }
              : {
                  stack: [
                    {
                      canvas: [
                        { type: 'rect', x: 0, y: 0, w: 110, h: 1, color: '#000000' },
                        { type: 'rect', x: 160, y: 0, w: 110, h: 1, color: '#000000' },
                      ],
                      margin: [0, 80, 0, 0],
                    },
                    {
                      columns: [
                        [
                          {
                            text: [{ text: 'Revisada Por', style: 'letra10', bold: true }],
                            margin: [28, 3, 0, 0],
                          },
                        ],
                        [
                          {
                            text: [{ text: 'Cliente', style: 'letra10', bold: true }],
                            margin: [60, 3, 0, 0],
                          },
                        ],
                      ],
                    },
                  ],
                  margin: [0, -40, 0, 0],
                },

            {
              margin: [0, -12, 19, 0],
              table: {
                widths: ['*', 'auto'],
                body: [
                  [
                    { text: 'Bruto RD$: ', style: 'letra10', bold: true, alignment: 'right' },
                    {
                      text: fun_.numFormatTwoDecimals(data.Bruto),
                      style: 'letra10',
                      alignment: 'right',
                      margin: [0, 0, 0, 0],
                    },
                  ],
                  [
                    { text: 'Itbis RD$: ', style: 'letra10', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                    {
                      text: fun_.numFormatTwoDecimals(data.itbis),
                      style: 'letra10',
                      alignment: 'right',
                      margin: [0, -2, 0, 0],
                    },
                  ],
                  [
                    { text: 'Descuento RD$: ', style: 'letra10', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                    {
                      text: fun_.numFormatTwoDecimals(data.descuento),
                      style: 'letra10',
                      alignment: 'right',
                      margin: [0, -2, 0, 0],
                    },
                  ],
                  [
                    { text: 'TOTAL RD$: ', style: 'letra10', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                    {
                      text: fun_.numFormatTwoDecimals(data.total_factura),
                      style: 'letra10',
                      alignment: 'right',
                      margin: [0, -2, 0, 0],
                    },
                  ],
                  data.tipo === 'compra'
                    ? [{ text: '' }, { text: '' }]
                    : [
                        { text: 'Devuelta RD$: ', style: 'letra10', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                        {
                          text: fun_.numFormatTwoDecimals(data.devuelta),
                          style: 'letra10',
                          alignment: 'right',
                          margin: [0, -2, 0, 0],
                        },
                      ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },
      ],
      unbreakable: true,
    },
    {
      stack: [
        is_venta
          ? !is_contado
            ? {
                stack: [
                  {
                    text: '======================================================================================================================================================',
                  },
                  {
                    columns: [
                      {
                        stack: [
                          {
                            svg: `<svg viewBox="0 0 700 180">
                            <rect height="180" width="55" fill="#ffffff" rx="5" ry="5" x="0" y="0" stroke="black" />
                            <text transform="translate(16, ${infoPagare[configApp.cliente].altura_nombre}) rotate(-90)" font-weight="bold" style="font-size: 9px" > ${configApp.nombre_empresa} </text>
                            <text transform="translate(30, ${infoPagare[configApp.cliente].altura_direccion}) rotate(-90)" style="font-size: 9px"> ${configApp.direccion_empresa} </text>
                            <text transform="translate(45, 176) rotate(-90)" font-weight="bold" style="font-size: 9px" > Telefono: </text>
                            <text transform="translate(45, 137) rotate(-90)" style="font-size: 9px"> ${configApp.telefono_empresa} - </text>
                            <text transform="translate(45, 73) rotate(-90)" font-weight="bold" style="font-size: 9px" > Rnc: </text>
                            <text transform="translate(45, 55) rotate(-90)" style="font-size: 9px"> ${configApp.rnc_empresa} </text>
                        </svg>`,
                          },
                        ],
                        margin: [20, 5, 0, 0],
                      },
                      {
                        stack: [
                          {
                            svg: `<svg viewBox="0 0 950 180">
                        <rect height="180" width="890" fill="#ffffff" rx="5" ry="5" x="0" y="0" stroke="black" />

                        <text transform="translate(10, 15)" style="font-size: 8px" >DESPUÉS DE LA FECHA DE VENCIMIENTO DE ESTA FACTURA </text>
                      <text transform="translate(10, 25)" style="font-size: 8px" > QUE SON 30 DÍAS, SE GENERARÁ UN 2% DE RECARGO</text>

                        <text transform="translate(350, 20)" style="font-size: 15px" font-weight="bold">Unica de Cambio </text>

                        <text transform="translate(730, 20)" font-weight="bold" style="font-size: 13px" > Fecha: </text>
                        <text transform="translate(775, 20)" style="font-size: 13px"> ${fun_.my_dateFormater(data.fecha_equivalente)} </text>


                        <text transform="translate(10, 45)" style="font-size: 11px"> Debo y pagaré a  </text>
                        <text transform="translate(95, 45)" style="font-size: 11px" font-weight="bold"> ${configApp.nombre_empresa} </text>
                        <text transform="translate(${configApp.nombre_empresa.length * 7.9}, 45)" style="font-size: 11px"> la cantidad de :  </text>

                        <text transform="translate(10, 63)" style="font-size: 12px" font-weight="bold"> *** ${numero_letra}  *** </text>

                        <text transform="translate(10, 77)" style="font-size: 11px"> Valor recibido a mi (nuestra) entera satisfacción segun la</text>
                        <text transform="translate(292, 77)" style="font-size: 11px" font-weight="bold"> Factura No. ${fun_.my_padStart(data.numero_documento, 8, '0')}</text>
                        <text transform="translate(405, 77)" style="font-size: 11px"> para el fiel cumplimiento del pago</text>
                        <text transform="translate(572, 77)" style="font-size: 11px"> quedan afectados mis (nuestros) bienes habidos y por haber,</text>
                        <text transform="translate(10, 90)" style="font-size: 11px"> con renuncia de fuero de domicilio y de cualquier otra que puediera favorecerme (nos).</text>


                        <text transform="translate(10, 106)" style="font-size: 11px" font-weight="bold"> A: </text>
                        <text transform="translate(25, 106)" style="font-size: 15px" font-weight="bold"> ${data.cliente.nombre} </text>
                        <line x1="20" y1="110" x2="870" y2="110" style="stroke:#000000;stroke-width:1" />

                        <text transform="translate(10, 128)" style="font-size: 11px" font-weight="bold"> RD$ </text>
                        <rect height="20" width="300" fill="#ffffff" rx="0" ry="5" x="40" y="115" stroke="black" />
                        <text transform="translate(50, 128)" style="font-size: 12px" font-weight="bold"> ${fun_.numFormatTwoDecimals(data.total_factura)} </text>

                        <line x1="30" y1="163" x2="220" y2="163" style="stroke:#000000;stroke-width:1" />
                        <text transform="translate(100, 174)" style="font-size: 11px" >Nombre</text>

                        <line x1="250" y1="163" x2="470" y2="163" style="stroke:#000000;stroke-width:1" />
                        <text transform="translate(340, 174)" style="font-size: 11px" >Cedula</text>

                        <line x1="500" y1="163" x2="720" y2="163" style="stroke:#000000;stroke-width:1" />
                        <text transform="translate(548, 174)" style="font-size: 11px" >Firma Autorizada / Sello</text>

                    </svg>`,
                          },
                        ],
                        margin: [-640, 5, 0, 0],
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
