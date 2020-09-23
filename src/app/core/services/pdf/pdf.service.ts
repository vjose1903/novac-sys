import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

import { logoADM } from './files';
import { IpcRenderer } from 'electron';
import { IpcService } from '../ipc.service';
import { GLOBAL } from '../GLOBAL';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  constructor(private _ipc: IpcService) {}

  fecha(a: any) {
    moment.locale('es');
    const fechaFormato = moment(a).format('DD/MM/YYYY');
    return fechaFormato;
  }
  hora(a: any) {
    moment.locale('es');
    const horaFormato = moment(a).format('hh:mm a');
    return horaFormato;
  }
  // ==========================================================================================================================================================
  // CABECERA
  // ==========================================================================================================================================================
  cabeceraFacturaVenta(data) {
    const header = [
      {
        columns: [
          [
            {
              image: 'logo',
              width: 72,
              opacity: 0.85,
              margin: [90, 0, 0, 0],
            },
          ],
          [
            data.FACTURA_DE === 'nota'
              ? { text: '' }
              : {
                  text: 'FACTURA A ' + _.toUpper(data.condicion),
                  alignment: 'right',
                  bold: true,
                  fontSize: 14,
                  margin: [0, 15, 30],
                },
            //
          ],
        ],
      },
      {
        margin: [0, -67, 0, 0],
        stack: [
          {
            text: 'ADM Agroindustrial S.R.L',
            alignment: 'center',
            bold: true,
            fontSize: 17,
          },
          {
            text: 'Autopista Duarte Km0 El Higuero, La Vega',
            alignment: 'center',
          },
          {
            text: [
              { text: 'Telefono: ', fontSize: 10 },
              { text: '809-573-0060 ', fontSize: 10 },
              { text: ' RNC: ', fontSize: 10 },
              { text: '131-99603-5', fontSize: 10 },
            ],
            alignment: 'center',
          },
        ],
      },

      {
        margin: [15, 10, 0, 0],
        columns: [
          [
            {
              text: [
                data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: 'Cliente : ', fontSize: 12 } : { text: 'Suplidor : ', fontSize: 12 },
                data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.nombre, fontSize: 12 } : { text: data.suplidor.nombre, fontSize: 12 },
              ],
              margin: [0, 0, 0, 0],
            },
            {
              text: [
                data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: 'Rnc cliente : ', fontSize: 12 } : { text: 'Rnc suplidor : ', fontSize: 12 },
                data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.rnc, fontSize: 12 } : { text: data.suplidor.rnc, fontSize: 12 },
              ],
              margin: [0, 5, 0, 0],
            },
            {
              text: [
                { text: 'Dirección : ', fontSize: 12 },
                data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.direccion, fontSize: 12 } : { text: data.suplidor.direccion, fontSize: 12 },
              ],
              margin: [0, 5, 0, 0],
            },
          ],
          [
            {
              text: [{ text: data.tipo_factura, fontSize: 14 }],
              margin: [0, 15, 0, 0],
              alignment: 'center',
            },

            data.FACTURA_DE === 'compra'
              ? {
                  text: [{ text: '- - - COMPRA - - -', fontSize: 11 }],
                  margin: [0, 1, 0, 0],
                  alignment: 'center',
                }
              : { text: '' },

            data.FACTURA_DE === 'nota'
              ? {
                  text: [
                    { text: 'Aplicada a: ', fontSize: 11 },
                    { text: data.aplicada_a, fontSize: 11 },
                  ],
                  margin: [0, 1, 0, 0],
                  alignment: 'center',
                }
              : { text: '' },
          ],
          [
            {
              stack: [
                {
                  text: [
                    { text: 'Fecha : ', fontSize: 11.5 },
                    { text: this.fecha(data.created_at), fontSize: 11.5 },
                    { text: ' - ' + this.hora(data.created_at), fontSize: 11.5 },
                  ],
                  margin: [75, 0, 0, 0],
                },
                (data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota') && data.condicion === 'Contado'
                  ? { text: '' }
                  : {
                      text: [
                        { text: 'Fecha vencimiento : ', fontSize: 11.5 },
                        { text: this.fecha(data.fecha_vencimiento), fontSize: 11.5 },
                      ],
                      margin: [75, 3, 0, 0],
                    },

                {
                  text: [
                    { text: 'NCF : ', fontSize: 11.5 },
                    { text: data.numero_comprobante, fontSize: 11.5 },
                  ],
                  margin: [75, 3, 0, 0],
                },
                {
                  text: [
                    { text: 'Doc No : ', fontSize: 11.5 },
                    { text: _.padStart(data.numero_factura, 8, '0'), fontSize: 11.5 },
                  ],
                  margin: [75, 3, 0, 0],
                },
                {
                  text: [
                    { text: 'Valida hasta : ', fontSize: 11.5 },
                    { text: this.fecha(data.fecha_valida), fontSize: 11.5 },
                  ],
                  margin: [75, 3, 0, 0],
                },
              ],
              margin: data.condicion === 'Contado' ? [-10, 0, 0, 0] : [-10, -5, 0, 0],
            },
          ],
        ],
      },

      // =============================================================
      {
        canvas: [
          {
            type: 'rect',
            x: 10,
            y: 3,
            w: 760,
            h: 2,
            color: '#000000',
          },
        ],
      },

      {
        style: 'tableExample',
        table: {
          headerRows: 1,
          widths: [30, 245, 65, '*', '*', '*', '*'],
          body: [
            [
              { text: ' #', style: 'tableHeader', bold: true, margin: [8, 0, 0, 0] },
              { text: 'Articulo', style: 'tableHeader', bold: true, margin: [8, 0, 0, 0] },
              { text: 'Cantidad', style: 'tableHeader', bold: true, margin: [5, 0, 0, 0] },
              { text: 'Unidad', style: 'tableHeader', bold: true, margin: [-1, 0, 0, 0] },
              data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota'
                ? { text: 'Precio', style: 'tableHeader', bold: true, margin: [13, 0, 0, 0] }
                : { text: 'Costo', style: 'tableHeader', bold: true, margin: [14, 0, 0, 0] },
              { text: 'Itbis', style: 'tableHeader', bold: true, margin: [8, 0, 0, 0] },
              { text: 'Total', style: 'tableHeader', bold: true, margin: [12, 0, 0, 0] },
            ],

            [1, 'Sample value 1', 'value 2', 'value 3', 'value 4', 'value 5', 'value 6'],
          ],
        },
        margin: [10, 0, 0, 0],
        layout: 'headerLineOnly',
      },
    ];

    return header;
  }

  // ==========================================================================================================================================================
  // CONTENIDO
  // =========================================================~=================================================================================================
  calcularPrecio(cant, precio, tipo) {
    const res = cant * precio;
    return GLOBAL.redondearAdos(res);
  }

  contenidoFacturaVenta(data) {
    const tempBody = [];
    data.detalle_facturas.forEach((detalle, i) => {
      const row = [];

      row.push(
        i + 1,
        detalle.descripcion,
        { text: GLOBAL.numFormatTwoDecimals(detalle.cantidad), alignment: 'right', margin: [0, 0, 25, 0] },
        { text: detalle.unidad, margin: [8, 0, 0, 0] },
        { text: GLOBAL.numFormatTwoDecimals(data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? detalle.precio : detalle.costo), alignment: 'right', margin: [0, 0, 10, 0] },
        { text: GLOBAL.numFormatTwoDecimals(detalle.itbis), alignment: 'right', margin: [0, 0, 32, 0] },
        { text: GLOBAL.numFormatTwoDecimals(detalle.total), alignment: 'right', margin: [0, 0, 26, 0] },
      );
      tempBody.push(row);
    });
    const content = [
      {
        style: 'tableExample',
        table: {
          widths: [24, 240, '*', 55, '*', '*', '*'],
          body: tempBody,
        },
        margin: data.condicion === 'Contado' ? [0, -2, 0, 0] : [0, -6, 0, 0],
        layout: {
          hLineWidth: (i, node) => {
            return i === node.table.body.length ? 2 : 1;
          },
          vLineWidth: (i, node) => {
            return 0;
          },
          hLineColor: (i, node) => {
            return i === 0 || i === node.table.body.length || i === 1 ? 'black' : 'gray';
          },
          vLineColor: (i, node) => {
            return i === 0 || i === node.table.widths.length ? 'black' : 'gray';
          },
        },
      },
      {
        text: [
          { text: 'Realizada Por :  ', fontSize: 11, bold: true },
          { text: data.usuario, fontSize: 11 },
          data.vendedor ? { text: '    Vendedor :  ', fontSize: 11, bold: true } : { text: '' },
          data.vendedor ? { text: data.vendedor, fontSize: 11 } : { text: '' },
        ],
        margin: [0, 5, 0, 0],
      },

      {
        stack: [
          {
            table: {
              body: [
                [
                  { text: 'Bruto RD$: ', fontSize: 11, bold: true },
                  { text: GLOBAL.numFormatTwoDecimals(data.Bruto), fontSize: 11, alignment: 'right' },
                ],
                [
                  { text: 'Itbis RD$: ', fontSize: 11, bold: true },
                  { text: GLOBAL.numFormatTwoDecimals(data.itbis), fontSize: 11, alignment: 'right' },
                ],
                [
                  { text: 'Descuento RD$: ', fontSize: 11, bold: true },
                  { text: GLOBAL.numFormatTwoDecimals(data.descuento), fontSize: 11, alignment: 'right' },
                ],
                [
                  { text: 'TOTAL RD$: ', fontSize: 11, bold: true },
                  { text: GLOBAL.numFormatTwoDecimals(data.total_factura), fontSize: 11, alignment: 'right' },
                ],
                data.FACTURA_DE === 'nota'
                  ? [{ text: '' }]
                  : [
                      { text: 'Devuelta RD$: ', fontSize: 11, bold: true },
                      { text: GLOBAL.numFormatTwoDecimals(data.devuelta), fontSize: 11, alignment: 'right' },
                    ],
              ],
            },
            layout: 'noBorders',
            margin: [585, 3, 0, 0],
          },
          {
            stack: [
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 40,
                    y: 0,
                    w: 140,
                    h: 1,
                    color: '#000000',
                  },
                  data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota'
                    ? {
                        type: 'rect',
                        x: 260,
                        y: 0,
                        w: 140,
                        h: 1,
                        color: '#000000',
                      }
                    : {
                        type: 'rect',
                        x: 0,
                        y: 0,
                        w: 0,
                        h: 0,
                        color: '#ffffff',
                      },
                ],
                margin: [0, 30, 0, 0],
              },
              {
                columns: [
                  [
                    {
                      text: [{ text: 'Revisada Por', fontSize: 12, bold: true }],
                      margin: [75, 5, 0, 0],
                    },
                  ],
                  [
                    data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota'
                      ? {
                          text: [{ text: 'Cliente', fontSize: 12, bold: true }],
                          margin: [-70, 5, 0, 0],
                        }
                      : { text: '' },
                  ],
                ],
              },
            ],
            margin: [0, -40, 0, 0],
          },
        ],
        unbreakable: true,
      },
    ];

    return content;
  }

  // ==========================================================================================================================================================
  // UNIR FACTURA VENTA
  // ==========================================================================================================================================================

  makeFacturaVenta(data) {
    const DD = {
      pageSize: { width: 760, height: 480 },
      pageMargins: data.condicion === 'Contado' ? [10, 157.9, 0, 40] : [10, 173, 0, 40],
      header: this.cabeceraFacturaVenta(data),
      content: this.contenidoFacturaVenta(data),
      footer: (currentPage, pageCount) => {
        console.log('currentPage ', currentPage);

        return [
          {
            text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
            alignment: 'right',
            margin: [0, 0, 30, 0],
          },
          data.FACTURA_DE === 'venta'
            ? data.condicion === 'Contado'
              ? { text: '' }
              : {
                  text: 'Después de la fecha de vencimiento de la factura, se generará un 2% de recargo',
                  alignment: 'center',
                  margin: [0, -15, 0, 0],
                }
            : { text: '' },
        ];
      },
      images: {
        logo: logoADM,
      },

      // defaultStyle: {
      //   font: 'Roboto',
      // },
    };
    return DD;
  }
}
