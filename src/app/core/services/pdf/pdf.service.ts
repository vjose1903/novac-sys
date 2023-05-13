import { tFacturaD } from './../../../admin/facturacion/factura';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');

import * as _8_5x5_5 from './8.5x5.5/makePDF';
import * as roll80mm from './80mm_roll/makePDF';
import * as facturasCompraVenta from './facturasCompraVenta';
import * as cuadreCaja from './cuadreCaja';
import * as reportes from './reportes';
import { Ss } from '../singleton.service';
import { MessageTask } from '../../models/message-task';
import { KEYWORD_ELECTRON_PRINT_BASE64 } from '../../../../../electron/shared-electron-angular';
import { ConfigI } from '../../typescript/config-interface.utils';
import { fun } from '../functions.service';

@Injectable({ providedIn: 'root' })
export class PdfService {
  constructor() {}

  static generatePdf(params: { oPdf: { data: any; type?: any }; imprimir: boolean }): any {
    return new Promise((resolve, reject) => {
      let obj;
      let todo_true = true;
      const data = fun.duplicarJson(params.oPdf.data);
      const type_oPdf = params.oPdf.type;
      const reimprimir = params.oPdf.data.reimprimir ? true : false;
      const config: ConfigI = Ss.configServ.getConfig({ isPromise: false });

      let options;
      let printer_selected = config.printer_selected[type_oPdf];

      data['reimprimir'] = reimprimir;

      data.fecha = fun.hasValue(data.fecha_equivalente) ? data.fecha_equivalente : data.fecha;
      try {
        switch (type_oPdf) {
          case 'recibo_ingreso':
            options = { '80mm_roll': roll80mm, '8.5x5.5': _8_5x5_5, '8.5x11': _8_5x5_5 };
            obj = options[config.pages_sizes.recibo_ingreso].makePDF(data, 'reciboI.pdf', 'recibo_ingreso');
            break;

          case 'conduce':
            options = { '80mm_roll': roll80mm, '8.5x5.5': _8_5x5_5, '8.5x11': _8_5x5_5 };

            obj = options[config.pages_sizes.conduce].makePDF(data, 'conduce.pdf', 'conduce');
            break;

          case 'nota':
            options = { '80mm_roll': roll80mm, '8.5x5.5': _8_5x5_5, '8.5x11': _8_5x5_5 };

            const tipo_pdf = `_${config.plantillas_impresion['nota'].toLowerCase()}`;

            obj = options[config.pages_sizes.nota].makePDF(data, 'nota.pdf', 'notas', tipo_pdf);
            break;

          case 'facturacion':
            options = { '80mm_roll': roll80mm, '8.5x5.5': facturasCompraVenta, '8.5x11': facturasCompraVenta };
            const tipo_documento = this.getFacturacionType(data);
            printer_selected = config.printer_selected[tipo_documento];
            obj = options[config.pages_sizes[tipo_documento]].makePDF(data, 'factura.pdf', 'ventas');
            break;

          case 'cotizacion':
            options = { '80mm_roll': roll80mm, '8.5x5.5': _8_5x5_5, '8.5x11': _8_5x5_5 };
            obj = options[config.pages_sizes.cotizacion].makePDF(data, 'cotizacion.pdf', 'cotizacion');
            break;

          case 'pre_venta':
            options = { '80mm_roll': roll80mm, '8.5x5.5': _8_5x5_5, '8.5x11': _8_5x5_5 };
            obj = options[config.pages_sizes.pre_venta].makePDF(data, 'pre-venta.pdf', 'pre_venta');
            break;

          case 'cuadre_caja':
            options = { '80mm_roll': roll80mm, '8.5x5.5': cuadreCaja, '8.5x11': cuadreCaja };

            obj = options[config.pages_sizes.cuadre_caja].makePDF(data, 'cuadre.pdf', 'cuadre_caja');
            break;

          case 'reporte':
            obj = reportes.makeReporte(data);
            break;

          default:
            todo_true = false;
            break;
        }

        if (todo_true) {
          this.createPdfFromBase64(obj.doc, obj.file, reimprimir, (res) => {
            res['pageOrientation'] = obj.pageOrientation;
            if (params.imprimir) {
              this.imprimirBase64({ base64: res.base64, file: res.file, type: type_oPdf, printer: printer_selected, pageOrientation: res['pageOrientation'] })
                .then((res_impresion) => resolve(res_impresion))
                .catch((err_impresion) => reject(err_impresion));
            } else {
              resolve(res);
            }
          });
        } else {
          const respuesta = this.makeStatusObj({ msg: 'Error escribiendo el pdf.', status: 'no' });
          fun.toastError('Error generando el pdf.', 'ERROR');
          resolve(respuesta);
        }
      } catch (error) {
        console.error('error ', error);

        const respuesta = this.makeStatusObj({ msg: 'ERROR en el switch de tipos de pdf.', status: 'no', body: error });

        fun.toastError('ERROR en el switch de tipos de pdf.', 'ERROR');
        reject(respuesta);
      }
    });
  }

  static createPdfFromBase64(docDefinition, file_, reimprimir_, callback = (arg) => {}) {
    try {
      pdfMake.vfs = pdfFonts.pdfMake.vfs;

      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBase64((data) => {
        const respuesta = this.makeStatusObj({
          msg: 'Pdf Base64 correcto',
          file: file_,
          status: 'si',
          reimprimir: reimprimir_,
          base64: data,
          dd: docDefinition,
        });

        callback(respuesta);
      });
    } catch (error) {
      const respuesta = this.makeStatusObj({ msg: 'Error escribiendo el pdf.', status: 'no', body: error });
      callback(respuesta);
    }
  }

  static imprimirBase64(oBase: { base64: string; file: string; type: string; printer: string; pageOrientation: string }) {
    try {
      return new Promise<any>((resolve, reject) => {
        const task = new MessageTask(KEYWORD_ELECTRON_PRINT_BASE64, oBase);

        Ss._ipc
          .sendTask(task)
          .then((res) => {
            if (res['status'] == 'no') reject(res);
            else {
              res['pageOrientation'] = oBase.pageOrientation;
              resolve(res);
            }
          })
          .catch((err) => reject(err));
      });
    } catch (error) {
      console.error(error);
    }
  }

  static makeStatusObj(oStatus) {
    const obj = {};

    if (oStatus.msg) obj['msg'] = oStatus.msg;
    if (oStatus.file) obj['file'] = oStatus.file;
    if (oStatus.status) obj['status'] = oStatus.status;
    if (oStatus.reimprimir) obj['reimprimir'] = oStatus.reimprimir;
    if (oStatus.base64) obj['base64'] = oStatus.base64;
    if (oStatus.base64) obj['sBase64'] = JSON.stringify(oStatus.base64);
    if (oStatus.dd) obj['dd'] = oStatus.dd;
    if (oStatus.dd) obj['sDd'] = JSON.stringify(oStatus.dd);

    return obj;
  }

  static getFacturacionType(data) {
    return data.tipo == 'venta' ? (data.condicion == 'Crédito' ? 'venta_credito' : 'venta_contado') : 'compra';
  }
}
