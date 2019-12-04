import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import pdfMake from 'pdfmake/build/pdfmake';
@Injectable({
  providedIn: 'root',
})
export class PdfService {
  constructor() {}

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
            fontSize: 11,
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
              text: [
                { text: 'Cliente: ', fontSize: 12, bold: true },
                { text: data.cliente.nombre, fontSize: 11 },
              ],
              margin: [0, 0, 0, 0],
            },
            {
              text: [
                { text: 'Rnc cliente: ', fontSize: 12, bold: true },
                { text: data.cliente.rnc, fontSize: 11 },
              ],
              margin: [0, 5, 0, 0],
            },
            {
              text: [
                { text: 'Dirección: ', fontSize: 12, bold: true },
                { text: data.cliente.direccion, fontSize: 11 },
              ],
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
            {
              text: [
                { text: 'Fecha vencimiento: ', fontSize: 10, bold: true },
                { text: this.fecha(data.fecha_vencimiento), fontSize: 10 },
              ],
              margin: [60, 3, 0, 0],
            },
            {
              text: [
                { text: 'NCF: ', fontSize: 10, bold: true },
                { text: data.numero_comprobante, fontSize: 11 },
              ],
              margin: [60, 3, 0, 0],
            },
            {
              text: [
                { text: 'Fact No: ', fontSize: 10, bold: true },
                { text: _.padStart(data.numero_factura, 8, '0'), fontSize: 11 },
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
            x: 30,
            y: 5,
            w: 690,
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
        margin: [30, 2.5, 30, 0],
        layout: 'headerLineOnly',
      },
    ];

    return header;
  }

  makeFacturaVenta(data) {
    var dd = {
      pageSize: { width: 750, height: 480 },
      pageMargins: [30, 185, 30, 40],
      header: this.cabeceraFacturaVenta(data),
      images: '../../../assets/img/logoBlancoNegro.jpg',
    };

    const win = window.open('', '_blank');
    pdfMake.createPdf(dd).open({}, win);
  }
}
