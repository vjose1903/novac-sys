import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

import { logoADM } from './files';
import { IpcRenderer } from 'electron';
import { IpcService } from '../ipc.service';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  constructor(private _ipc: IpcService) {}
  getInicioDeRuta(para) {
    const path = __dirname;
    const pathSplit = _.split(path, '/');
    const temp = [];
    for (let index = 0; index < pathSplit.length; index++) {
      const element = pathSplit[index];
      temp.push(element);
      if (element === para) {
        return _.join(temp, '/');
        break;
      }
    }
    // console.log(pathSplit);
  }

  redondearAdos(num) {
    return (Math.round(num * 100) / 100).toFixed(2);
  }

  formatearNumero(nStr) {
    if (nStr !== undefined) {
      nStr += '';
      const x = nStr.split('.');
      let x1 = x[0];
      const x2 = x.length > 1 ? '.' + x[1] : '';
      const rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }
  }

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
              margin: [90, 12, 0, 0],
            },
          ],
          [
            {
              text: 'FACTURA A ' + _.toUpper(data.condicion),
              alignment: 'right',
              bold: true,
              fontSize: 14,
              margin: [0, 20, 30],
            },
            //
          ],
        ],
      },
      {
        margin: [0, -62, 0, 0],
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
              { text: 'Telefono: ', fontSize: 9, bold: true },
              { text: '809-572-0060 ', fontSize: 9 },
              { text: ' RNC: ', fontSize: 9, bold: true },
              { text: '131-99603-5', fontSize: 9 },
            ],
            alignment: 'center',
          },
        ],
      },

      {
        margin: [30, 20, 0, 0],
        columns: [
          [
            {
              text: [{ text: 'Cliente: ', fontSize: 12, bold: true }, { text: data.cliente.nombre }],
              margin: [0, 0, 0, 0],
            },
            {
              text: [{ text: 'Rnc cliente: ', fontSize: 12, bold: true }, { text: data.cliente.rnc }],
              margin: [0, 5, 0, 0],
            },
            {
              text: [{ text: 'Dirección: ', fontSize: 12, bold: true }, { text: data.cliente.direccion }],
              margin: [0, 5, 0, 0],
            },
          ],
          [
            {
              text: [{ text: data.tipo_factura, fontSize: 14, bold: true }],
              margin: [0, 15, 0, 0],
              alignment: 'center',
            },
          ],
          [
            {
              text: [
                { text: 'Fecha: ', fontSize: 10, bold: true },
                { text: this.fecha(data.created_at), fontSize: 10 },
                { text: ' - ' + this.hora(data.created_at), fontSize: 10 },
              ],
              margin: [60, 0, 0, 0],
            },
            data.condicion === 'Contado'
              ? null
              : {
                  text: [
                    { text: 'Fecha vencimiento: ', fontSize: 10, bold: true },
                    { text: this.fecha(data.fecha_vencimiento), fontSize: 10 },
                  ],
                  margin: [60, 3, 0, 0],
                },

            {
              text: [
                { text: 'NCF: ', fontSize: 10, bold: true },
                { text: data.numero_comprobante, fontSize: 10 },
              ],
              margin: [60, 3, 0, 0],
            },
            {
              text: [
                { text: 'Fact No: ', fontSize: 10, bold: true },
                { text: _.padStart(data.numero_factura, 8, '0'), fontSize: 10 },
              ],
              margin: [60, 3, 0, 0],
            },
            {
              text: [
                { text: 'Valida hasta: ', fontSize: 10, bold: true },
                { text: this.fecha(data.fecha_valida), fontSize: 10 },
              ],
              margin: [60, 3, 0, 0],
            },
          ],
        ],
      },

      // =============================================================
      {
        canvas: [
          {
            type: 'rect',
            x: 25,
            y: 5,
            w: 710,
            h: 2,
            color: '#000000',
          },
        ],
      },

      {
        style: 'tableExample',
        table: {
          headerRows: 1,
          widths: [23, 233, '*', '*', '*', '*', '*'],
          body: [
            [
              { text: '#', style: 'tableHeader', bold: true },
              { text: 'Articulo', style: 'tableHeader', bold: true },
              { text: 'Cantidad', style: 'tableHeader', bold: true },
              { text: 'Unidad', style: 'tableHeader', bold: true },
              { text: 'Precio', style: 'tableHeader', bold: true },
              { text: 'Itbis', style: 'tableHeader', bold: true },
              { text: 'Total', style: 'tableHeader', bold: true },
            ],

            [1, 'Sample value 1', 'value 2', 'value 3', 'value 4', 'value 5', 'value 6'],
          ],
        },
        margin: [25, 0, 25, 0],
        layout: 'headerLineOnly',
      },
    ];

    return header;
  }

  // ==========================================================================================================================================================
  // CONTENIDO
  // ==========================================================================================================================================================
  calcularPrecio(cant, precio, tipo) {
    const res = cant * precio;
    return this.redondearAdos(res);
  }
  contenidoFacturaVenta(data) {
    const tempBody = [];
    data.detalle_facturas.forEach((detalle, i) => {
      const row = [];

      row.push(
        i + 1,
        detalle.descripcion,
        this.formatearNumero(this.redondearAdos(detalle.cantidad)),
        detalle.unidad,
        this.formatearNumero(this.calcularPrecio(detalle.cantidad, detalle.precio, '')),
        detalle.itbis !== 0 ? this.formatearNumero(this.redondearAdos(detalle.itbis)) : '',
        this.formatearNumero(this.redondearAdos(detalle.total)),
      );
      tempBody.push(row);
    });
    const content = [
      {
        style: 'tableExample',
        table: {
          // headerRows: 1,
          // widths: [23, 250, '*', '*', '*', '*', '*'],
          widths: [24, 260, '*', '*', '*', '*', '*'],
          body: tempBody,
        },
        margin: data.condicion === 'Contado' ? [0, -2, 0, 0] : [0, -6, 0, 0],
        // margin: [0, 1, 0, 0],
        //  layout: 'lightHorizontalLines'
        layout: {
          hLineWidth: function(i, node) {
            return i === node.table.body.length ? 2 : 1;
          },
          vLineWidth: function(i, node) {
            return 0;
          },
          hLineColor: function(i, node) {
            return i === 0 || i === node.table.body.length || i === 1 ? 'black' : 'gray';
          },
          vLineColor: function(i, node) {
            return i === 0 || i === node.table.widths.length ? 'black' : 'gray';
          },
        },
      },
      {
        text: [
          { text: 'Realizada Por:  ', fontSize: 11, bold: true },
          { text: 'Usuario', fontSize: 11 },
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
                  { text: this.formatearNumero(this.redondearAdos(data.Bruto)), fontSize: 11, alignment: 'right' },
                ],
                [
                  { text: 'Itbis RD$: ', fontSize: 11, bold: true },
                  { text: this.formatearNumero(this.redondearAdos(data.itbis)), fontSize: 11, alignment: 'right' },
                ],
                [
                  { text: 'Descuento RD$: ', fontSize: 11, bold: true },
                  { text: this.formatearNumero(this.redondearAdos(data.descuento)), fontSize: 11, alignment: 'right' },
                ],
                [
                  { text: 'TOTAL RD$: ', fontSize: 11, bold: true },
                  { text: this.formatearNumero(this.redondearAdos(data.total_factura)), fontSize: 11, alignment: 'right' },
                ],
              ],
            },
            layout: 'noBorders',
            margin: [530, 3, 0, 0],
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
                  {
                    type: 'rect',
                    x: 260,
                    y: 0,
                    w: 140,
                    h: 1,
                    color: '#000000',
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
                    {
                      text: [{ text: 'Cliente', fontSize: 12, bold: true }],
                      margin: [-37, 5, 0, 0],
                    },
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
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
    // console.log(data);

    const dd = {
      pageSize: { width: 760, height: 480 },
      pageMargins: data.condicion === 'Contado' ? [25, 165.5, 25, 40] : [25, 184, 25, 40],
      header: this.cabeceraFacturaVenta(data),
      content: this.contenidoFacturaVenta(data),
      footer: (currentPage, pageCount) => {
        return [
          {
            text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
            alignment: 'right',
            margin: [0, 0, 30, 0],
          },
          {
            text: 'Después de la fecha de vencimiento de la factura, se generará un 2% de recargo',
            alignment: 'center',
            margin: [0, -15, 0, 0],
          },
        ];
      },
      images: {
        logo: logoADM,
      },
      defaultStyle: {
        font: 'Roboto',
      },
    };

    const PDF = pdfMake.createPdf(dd);
    return dd;

    // console.log(PDF);

    // console.log(JSON.stringify(dd));

    // PDF.print(options, (success, errorType) => {
    //   if (success) {
    //     console.log('todo correcto');
    //   } else {
    //     console.log('error');
    //     console.log(errorType);
    //   }
    // });

    // var win = window.open('', '_blank');
    // pdfMake.createPdf(dd).download('prueba.pdf');
  }

  // imprimir(filename, conexion) {
  //   console.log('filename', filename);

  //   nodePrinter.printFile({
  //     filename: filename,

  //     nodePrinter: process.env[3],
  //     // printer name, if missing then will print to default printer

  //     success: function(jobID) {
  //       conexion.send(
  //         JSON.stringify({
  //           type: 'success_print',
  //           data: { msj: 'impresion correcta ' + filename },
  //         }),
  //       );

  //       console.log('sent to printer with ID: ' + jobID);
  //     },

  //     error: function(err) {
  //       conexion.send(
  //         JSON.stringify({
  //           type: 'error_print',
  //           data: { msj: 'impresion incorrecta ' + filename },
  //         }),
  //       );

  //       console.log('errrrrrrr', err);
  //     },
  //   });
  // }
}
