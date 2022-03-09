import { Injectable } from '@angular/core';

const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import * as facturasCompraVenta from './facturasCompraVenta';
import * as recibosIngresos from './recibosIngresos';
import * as conduce from './conduce';
import * as cuadreCaja from './cuadreCaja';
import * as reportes from './reportes';
import { SingletonService } from '../singleton.service';
import { MessageTask } from '../../models/message-task';
import { KEYWORD_ELECTRON_PRINT_BASE64 } from '../../../../../electron/shared-electron-angular';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  fun = SingletonService.fun;
  _ipc = SingletonService._ipc;
  constructor() {}

  generatePdf(params: { oPdf: { data: any; type?: any }; imprimir: boolean }): any {
    return new Promise((resolve, reject) => {
      let obj;
      let todo_true = true;
      const data = params.oPdf.data;
      const type_oPdf = params.oPdf.type;
      const reimprimir = params.oPdf.data.reimprimir ? true : false;

      data['reimprimir'] = reimprimir;

      try {
        switch (type_oPdf) {
          case 'recibo_ingreso':
            obj = recibosIngresos.makeRecibo(data);
            break;

          case 'conduce':
            obj = conduce.makeConduce(data);
            break;

          case 'facturacion':
            obj = facturasCompraVenta.makeFacturaVenta(data);
            break;

          case 'cuadre_caja':
            obj = cuadreCaja.makeCuadre(data);
            break;

          case 'reporte':
            obj = reportes.makeReporte(data);
            break;

          default:
            todo_true = false;
            break;
        }

        this.fun.logGreen('todo_true --> ', todo_true);

        if (todo_true) {
          const dd = obj.doc;
          const file = obj.file;
          const type = obj.type;

          this.createPdfbase64(dd, file, reimprimir, (res) => {
            res['scale'] = obj.scale;

            if (params.imprimir) {
              this.imprimirBase64({ base64: res.body, filename: res.file, type: type_oPdf })
                .then((res_impresion) => resolve(res_impresion))
                .catch((err_impresion) => reject(err_impresion));
            } else {
              resolve(res);
            }
          });
        } else {
          const respuesta = this.makeStatusObj({ msg: 'Error escribiendo el pdf.', status: 'no' });
          this.fun.toastError('Error generando el pdf.', 'ERROR');
          resolve(respuesta);
        }
      } catch (error) {
        console.log('error ', error);

        const respuesta = this.makeStatusObj({ msg: 'ERROR en el switch de tipos de pdf.', status: 'no', body: error });

        this.fun.toastError('ERROR en el switch de tipos de pdf.', 'ERROR');
        reject(respuesta);
      }
    });
  }

  createPdfbase64(docDefinition, file_, reimprimir_, callback = (arg) => {}) {
    try {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBase64((data) => {
        // if (type === 'base64' || retunBase64) {
        const respuesta = this.makeStatusObj({
          msg: 'Pdf Base64 correcto',
          file: file_,
          status: 'si',
          reimprimir: reimprimir_,
          body: data,
          dd: docDefinition,
        });
        callback(respuesta);

        // } else {
        //   generatePdfFileFormBase64(file_, data, type);
        // }
      });
    } catch (error) {
      const respuesta = this.makeStatusObj({ msg: 'Error escribiendo el pdf.', status: 'no', body: error });
      callback(respuesta);
    }
  }

  imprimirBase64(oBase: { base64: string; filename: string; type: string }) {
    return new Promise<any>((resolve, reject) => {
      const task = new MessageTask(KEYWORD_ELECTRON_PRINT_BASE64, oBase);

      this._ipc
        .sendTask(task)
        .then((res) => {
          if (res['status'] == 'no') reject(res);
          else resolve(res);
        })
        .catch((err) => reject(err));
    });
  }

  makeStatusObj(oStatus) {
    const obj = {};

    if (oStatus.msg) obj['msg'] = oStatus.msg;
    if (oStatus.file) obj['file'] = oStatus.file;
    if (oStatus.status) obj['status'] = oStatus.status;
    if (oStatus.reimprimir) obj['reimprimir'] = oStatus.reimprimir;
    if (oStatus.body) obj['body'] = oStatus.body;
    if (oStatus.body) obj['sbody'] = JSON.stringify(oStatus.body);
    if (oStatus.dd) obj['dd'] = oStatus.dd;
    if (oStatus.dd) obj['sDd'] = JSON.stringify(oStatus.dd);

    return obj;
  }
}
