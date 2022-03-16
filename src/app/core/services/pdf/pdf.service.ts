import { Injectable } from '@angular/core';
import * as _ from 'lodash';
const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import * as _8_5x5_5 from './8.5x5.5/makePDF';
import * as roll80mm from './80mm_roll/makePDF';
import * as facturasCompraVenta from './facturasCompraVenta';
import * as recibosIngresos from './recibosIngresos';
import * as conduce from './conduce';
import * as cuadreCaja from './cuadreCaja';
import * as reportes from './reportes';
import { SingletonService } from '../singleton.service';
import { MessageTask } from '../../models/message-task';
import { KEYWORD_ELECTRON_PRINT_BASE64 } from '../../../../../electron/shared-electron-angular';
import { ConfigurationService } from '../configuration.service';
import { ConfigI } from '../../typescript/config-interface';

@Injectable({ providedIn: 'root' })
export class PdfService {
  fun = SingletonService.fun;
  _ipc = SingletonService._ipc;

  constructor(public configServ: ConfigurationService) {}

  generatePdf(params: { oPdf: { data: any; type?: any }; imprimir: boolean }): any {
    return new Promise((resolve, reject) => {
      let obj;
      let todo_true = true;
      const data = this.fun.duplicarJson(params.oPdf.data);
      const type_oPdf = params.oPdf.type;
      const reimprimir = params.oPdf.data.reimprimir ? true : false;
      const config: ConfigI = this.configServ.getConfig({ isPromise: false });

      let options, documento;
      data['reimprimir'] = reimprimir;

      data.fecha = data.fecha_equivalente;
      try {
        switch (type_oPdf) {
          case 'recibo_ingreso': // SI SI
            options = { '80mm_roll': roll80mm, '8.5x5.5': recibosIngresos, '8.5x11': recibosIngresos };

            data.identificador = data.numero_recibo;
            data.numero_documento = data.numero_recibo;
            data.tipo_pdf = 'RECIBO DE INGRESOS';
            data.contenido_reporte = data.detalle_recibos;
            data.usuario = data.user.nombre_completo;

            documento = _.find(data.cliente.documentos_de_identidad, (item) => item.principal);
            data.cliente.rnc = documento ? documento.documento : '----------';

            data.contenido_reporte.map((detalle) => {
              detalle['tipo'] = _.split(detalle.descripcion, ' ')[0];
              detalle['comprobante_fiscal'] = _.split(detalle.descripcion, ' ')[1];
              detalle['fecha'] = _.split(detalle.descripcion, ' ')[2];
            });

            obj = options[config.pages_sizes.recibo_ingreso].makePDF(data, 'reciboI.pdf', 'recibo_ingreso');
            break;

          case 'conduce': // SI SI
            options = { '80mm_roll': roll80mm, '8.5x5.5': conduce, '8.5x11': conduce };
            data.contenido_reporte = data.detalle_conduces;

            documento = _.find(data.cliente.documentos_de_identidad, (item) => item.principal);
            data.cliente.rnc = documento ? documento.documento : '----------';

            data.tipo_pdf = 'CONDUCE DE MERCANCIA';
            data.numero_documento = data.numero_conduce;
            data.usuario = data.user.nombre_completo;
            data.identificador = data.numero_documento;

            data.contenido_reporte.map((detalle) => {
              detalle['cantidad'] = `${this.fun.numFormatTwoDecimals(detalle.cantidad)} ${detalle.unidad}`;
            });

            obj = options[config.pages_sizes.conduce].makePDF(data, 'conduce.pdf', 'conduce');
            break;

          case 'nota':
            options = { '80mm_roll': roll80mm, '8.5x5.5': _8_5x5_5, '8.5x11': _8_5x5_5 };

            obj = options[config.pages_sizes.facturacion].makePDF(data, 'nota.pdf', 'notas');
            break;
          case 'facturacion': // SI SI
            options = { '80mm_roll': roll80mm, '8.5x5.5': facturasCompraVenta, '8.5x11': facturasCompraVenta };

            data.total = data.total_factura;
            data.numero_documento = data.numero_factura;
            data.contenido_reporte = data.detalle_facturas;
            data.tipo_pdf = data.tipo_factura.toUpperCase();

            data.contenido_reporte.map((detalle) => {
              detalle['cantidad'] = `${this.fun.numFormatTwoDecimals(detalle.cantidad)} ${detalle.unidad}`;
            });

            obj = options[config.pages_sizes.facturacion].makePDF(data, 'factura.pdf', 'ventas');
            break;

          case 'cuadre_caja': // SI SI
            options = { '80mm_roll': roll80mm, '8.5x5.5': cuadreCaja, '8.5x11': cuadreCaja };

            data.tipo_pdf = 'CUADRE DE CAJA';
            data.numero_documento = data.numero_reporte;
            data.identificador = data.numero_documento;

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
        console.error('error ', error);

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
