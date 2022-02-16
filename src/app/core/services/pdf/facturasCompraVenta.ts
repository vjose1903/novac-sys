/* eslint-disable @typescript-eslint/indent */
import * as fun_ from './utils/funciones';
import { styles_ } from './utils/files';
import * as numLetra from './utils/numero_letras';
import { SingletonService } from '../singleton.service';
// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================
function getPageMargin(is_contado) {
  let margins = [];

  if (is_contado) {
    margins = [0, 158, 0, 30];
  } else {
    margins = [0, 174, 0, 30];
  }

  return margins;
}

export function makeFacturaVenta(data) {
  const is_venta = data.FACTURA_DE === 'venta' ? true : false;
  const is_contado = data.condicion === 'Contado' ? true : false;
  const is_nota = data.FACTURA_DE === 'nota' ? true : false;

  const configApp = SingletonService.configServ.getConfig({ isPromise: false });

  const dd = {
    pageSize: is_contado ? { width: 990, height: 398 } : { width: 990, height: 796 },
    pageMargins: getPageMargin(is_contado),
    header: (currentPage, pageCount, pageSize) => {
      return cabeceraFacturaVenta(data, is_nota, is_contado, is_venta, currentPage, pageCount, configApp);
    },
    content: contenidoFacturaVenta(data, is_nota, is_contado, is_venta),
    images: {
      logo: `data:image/png;base64,${configApp.logo_impresion}`,
    },
    styles: styles_,
  };

  const obj = {
    doc: dd,
    file: 'factura.pdf',
    type: 'file',
  };

  return obj;
}

// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraFacturaVenta(data, is_nota, is_contado, is_venta, currentPage, pageCount, configApp) {
  const header = [
    {
      columns: [
        [
          {
            text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
            alignment: 'left',
            margin: [15, 10, 0, 0],
          },
          {
            image: 'logo',
            width: 72,
            height: 45,
            margin: [90, -12, 0, 0],
          },
        ],
        [
          is_nota
            ? { text: '' }
            : {
                text: 'FACTURA A ' + data.condicion.toUpperCase(),
                alignment: 'right',
                bold: true,
                style: 'letra14',
                margin: [0, 20, 30, 0],
              },
          {
            text: data.tipo_factura,
            style: 'letra14',
            margin: [0, is_nota ? 20 : 2, 30, 0],
            alignment: 'right',
          },

          is_nota
            ? {
                text: `Aplicada a: ${data.aplicada_a}`,
                style: 'letra11',
                margin: [0, 2, 30, 0],
                alignment: 'right',
              }
            : { text: '' },
          //
        ],
      ],
    },
    {
      margin: [0, -40, 0, 0],
      stack: [
        {
          text: 'ADM Agroindustrial S.R.L',
          alignment: 'center',
          bold: true,
          style: 'letra17',
        },
        {
          text: 'Autopista Duarte Km0 El Higüero, La Vega',
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
      margin: [15, 8, 0, 0],
      text: [
        {
          text: [
            is_venta || is_nota ? { text: 'Cliente : ', style: 'letra12' } : { text: 'Suplidor : ', style: 'letra12' },
            is_venta || is_nota ? { text: data.cliente.nombre, style: 'letra12' } : { text: data.suplidor.nombre, style: 'letra12' },
          ],
        },
      ],
    },

    {
      text: [
        is_venta || is_nota ? { text: 'Rnc cliente : ', style: 'letra12' } : { text: 'Rnc suplidor : ', style: 'letra12' },
        is_venta || is_nota ? { text: data.cliente.rnc, style: 'letra12' } : { text: data.suplidor.rnc, style: 'letra12' },
      ],
      margin: [15, 5, 0, 0],
    },

    {
      margin: [15, 5, 0, 0],
      text: [
        {
          text: [{ text: 'Dirección : ', style: 'letra12' }, is_venta || is_nota ? { text: data.cliente.direccion, style: 'letra12' } : { text: data.suplidor.direccion, style: 'letra12' }],
        },
      ],
    },

    {
      margin: [710, -50, 0, 0],
      stack: [
        {
          text: [
            { text: 'Fecha : ', style: 'letra11' },
            { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra11' },
            { text: ' - ' + fun_.my_houreFormater(data.fecha_equivalente), style: 'letra11' },
          ],
          margin: [85, -10, 0, 0],
        },
        is_contado
          ? { text: '' }
          : {
              text: [
                { text: 'Fecha vencimiento : ', style: 'letra11' },
                { text: fun_.my_dateFormater(data.fecha_vencimiento), style: 'letra11' },
              ],
              margin: [85, 3, 0, 0],
            },
        {
          text: [
            { text: 'NCF : ', style: 'letra11' },
            { text: data.numero_comprobante, style: 'letra11' },
          ],
          margin: [85, 3, 0, 0],
        },
        {
          text: [
            { text: 'Doc No : ', style: 'letra11' },
            { text: fun_.my_padStart(data.numero_factura, 8, '0'), style: 'letra11' },
          ],
          margin: [85, 3, 0, 0],
        },
        {
          text: [
            { text: 'Valida hasta : ', style: 'letra11' },
            data.tipo_factura_id === 3 ? { text: 'No aplica.', style: 'letra11' } : data.FACTURA_DE === 'compra' ? { text: ' ' } : { text: fun_.my_dateFormater(data.fecha_valida), style: 'letra11' },
          ],
          margin: [85, 3, 0, 0],
        },
      ],
    },

    // =============================================================
    {
      canvas: [
        {
          type: 'rect',
          x: 10,
          y: 3,
          w: 970,
          h: 2,
          color: '#000000',
        },
      ],
    },

    {
      style: 'tableExample',
      table: {
        headerRows: 1,
        widths: [30, 245, '*', '*', '*', '*', '*'],
        body: [
          [
            { text: ' #', bold: true, alignment: 'center', margin: [4, 0, 0, 0] },
            { text: 'Articulo', bold: true, margin: [-5, 0, 0, 0] },
            { text: 'Cantidad', bold: true, alignment: 'right', margin: [0, 0, 5, 0] },
            { text: 'Unidad', bold: true, alignment: 'center', margin: [0, 0, 15, 0] },
            is_venta || is_nota ? { text: 'Precio', bold: true, alignment: 'right', margin: [0, 0, 17, 0] } : { text: 'Costo', bold: true, alignment: 'right', margin: [0, 0, 18, 0] },
            { text: 'Itbis', bold: true, alignment: 'right', margin: [0, 0, 17, 0] },
            { text: 'Total', bold: true, alignment: 'right', margin: [0, 0, 18, 0] }, // margin: [12, 0, 0, 0]
          ],

          [1, 'Sample value 1', 'value 2', 'value 3', 'value 4', 'value 5', 'value 6'],
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
function calcularPrecio(cant, precio, tipo) {
  const res = cant * precio;
  return fun_.redondearAdos(res);
}

function contenidoFacturaVenta(data, is_nota, is_contado, is_venta) {
  const tempBody = [];
  const _break = is_contado ? 6 : 26;
  data.detalle_facturas.forEach((detalle, i) => {
    const row = [];
    const br_ = i !== 0 && i % _break === 0;

    row.push(
      { text: i + 1, alignment: 'center', pageBreak: br_ ? 'before' : 'none' },
      { text: detalle.descripcion, pageBreak: br_ ? 'before' : 'none' },
      { text: fun_.numFormatTwoDecimals(detalle.cantidad), alignment: 'right', margin: [0, 0, 15, 0], pageBreak: br_ ? 'before' : 'none' },
      { text: detalle.unidad, alignment: 'center', pageBreak: br_ ? 'before' : 'none' },
      {
        text: fun_.numFormatTwoDecimals(is_venta || is_nota ? detalle.precio : detalle.costo),
        alignment: 'right',
        margin: [0, 0, 14, 0],
        pageBreak: br_ ? 'before' : 'none',
      },
      { text: fun_.numFormatTwoDecimals(detalle.itbis), alignment: 'right', margin: [0, 0, 15, 0], pageBreak: br_ ? 'before' : 'none' },
      { text: fun_.numFormatTwoDecimals(detalle.total), alignment: 'right', margin: [0, 0, 15, 0], pageBreak: br_ ? 'before' : 'none' },
    );
    tempBody.push(row);
  });

  const numero_letra = numLetra.NumeroALetras(data.total_factura);

  const content = [
    {
      style: 'tableExample',
      table: {
        widths: [30, 245, '*', '*', '*', '*', '*'],
        body: tempBody,
      },
      margin: is_contado ? [10, -2, 10, 0] : [10, -2, 10, 0],
      layout: {
        hLineWidth: (i, node) => {
          return i % _break === 0 && node.table.body.length !== _break ? 0 : i === node.table.body.length ? 2 : 1;
        },
        vLineWidth: (i, node) => {
          return 0;
        },
        hLineColor: (i, node) => {
          return i === node.table.body.length ? 'black' : 'gray';
        },
        vLineColor: (i, node) => {
          return 'black';
        },
      },
    },
    {
      text: [
        { text: 'Realizada Por :  ', style: 'letra11', bold: true },
        { text: data.usuario, style: 'letra11' },
        data.vendedor ? { text: '    Vendedor :  ', style: 'letra11', bold: true } : { text: '' },
        data.vendedor ? { text: data.vendedor, style: 'letra11' } : { text: '' },
      ],
      margin: [20, 5, 0, 0],
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
                        { type: 'rect', x: 10, y: 0, w: 160, h: 1, color: '#000000' },
                        { type: 'rect', x: 250, y: 0, w: 160, h: 1, color: '#000000' },
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
                            margin: [65, 5, 0, 0],
                          },
                        ],
                      ],
                    },
                  ],
                  margin: [0, -40, 0, 0],
                },

            {
              margin: [0, -12, 0, 0],
              table: {
                widths: ['*', 'auto'],
                body: [
                  [
                    { text: 'Bruto RD$: ', style: 'letra11_5', bold: true, alignment: 'right' },
                    {
                      text: fun_.numFormatTwoDecimals(data.Bruto),
                      style: 'letra11_5',
                      alignment: 'right',
                      margin: [0, 0, data.detalle_facturas.length <= 5 ? 29 : 49, 0],
                    },
                  ],
                  [
                    { text: 'Itbis RD$: ', style: 'letra11_5', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                    {
                      text: fun_.numFormatTwoDecimals(data.itbis),
                      style: 'letra11_5',
                      alignment: 'right',
                      margin: [0, -2, data.detalle_facturas.length <= 5 ? 29 : 49, 0],
                    },
                  ],
                  [
                    { text: 'Descuento RD$: ', style: 'letra11_5', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                    {
                      text: fun_.numFormatTwoDecimals(data.descuento),
                      style: 'letra11_5',
                      alignment: 'right',
                      margin: [0, -2, data.detalle_facturas.length <= 5 ? 29 : 49, 0],
                    },
                  ],
                  [
                    { text: 'TOTAL RD$: ', style: 'letra11_5', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                    {
                      text: fun_.numFormatTwoDecimals(data.total_factura),
                      style: 'letra11_5',
                      alignment: 'right',
                      margin: [0, -2, data.detalle_facturas.length <= 5 ? 29 : 49, 0],
                    },
                  ],
                  data.FACTURA_DE === 'compra' || is_nota
                    ? [{ text: '' }, { text: '' }]
                    : [
                        { text: 'Devuelta RD$: ', style: 'letra11_5', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                        {
                          text: fun_.numFormatTwoDecimals(data.devuelta),
                          style: 'letra11_5',
                          alignment: 'right',
                          margin: [0, -2, data.detalle_facturas.length <= 5 ? 29 : 49, 0],
                        },
                      ],
                ],
              },
              layout: 'noBorders',
              // margin: [585, 3, 0, 0],
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

                            <text transform="translate(18, 165) rotate(-90)" font-weight="bold" style="font-size: 12px" > ADM AGROINDUSTRIAL SRL </text>
                            <text transform="translate(30, 175) rotate(-90)" style="font-size: 9px"> Autopista Duarte Km0 El Higuero, La Vega </text>
                            <text transform="translate(45, 175) rotate(-90)" font-weight="bold" style="font-size: 9px" > Telefono: </text>
                            <text transform="translate(45, 136) rotate(-90)" style="font-size: 9px"> 809-573-0060 - </text>
                            <text transform="translate(45, 75) rotate(-90)" font-weight="bold" style="font-size: 9px" > Rnc: </text>
                            <text transform="translate(45, 57) rotate(-90)" style="font-size: 9px"> 131-99603-5 </text>
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
                        <text transform="translate(95, 45)" style="font-size: 11px" font-weight="bold"> ADM AGROINDUSTRIAL SRL </text>
                        <text transform="translate(240, 45)" style="font-size: 11px"> la cantidad de :  </text>

                        <text transform="translate(10, 63)" style="font-size: 12px" font-weight="bold"> *** ${numero_letra}  *** </text>

                        <text transform="translate(10, 77)" style="font-size: 11px"> Valor recibido a mi (nuestra) entera satisfacción segun la</text>
                        <text transform="translate(292, 77)" style="font-size: 11px" font-weight="bold"> Factura No. ${fun_.my_padStart(data.numero_factura, 8, '0')}</text>
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
