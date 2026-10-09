import * as _8_5x5_5 from './8.5x5.5/makePDF';
import * as roll80mm from './80mm_roll/makePDF';
import * as facturasCompraVenta from './facturasCompraVenta';
import * as facturasCompraVentaElectronica from './facturasCompraVentaElectronica';
import * as cuadreCaja from './cuadreCaja';
import * as reportes from './reportes';
import { Ss } from '../../singleton.service';
import { ConfigI } from '../../../interface/config-interface';
import { fun } from '../../functions.service';
import { Injectable } from '@angular/core';

import { fonts } from '../utils/pdfFonts';
import { PdfAutoEllipsis } from '../utils/pdf-auto-ellipsis';
import { serie } from '@core/typescript/constantes';

type PrintErrorCode =
  | 'PRINT_PRINTER_NOT_CONFIGURED'
  | 'PRINT_PAYLOAD_INCOMPLETE'
  | 'PRINT_INVALID_PDF'
  | 'PRINT_PDF_GENERATION_FAILED'
  | 'PRINT_WRITE_PERMISSION'
  | 'PRINT_WRITE_DISK_SPACE'
  | 'PRINT_WRITE_FAILED'
  | 'PRINT_PDF_NOT_FOUND'
  | 'PRINT_ENGINE_NOT_FOUND'
  | 'PRINT_PRINTER_NOT_AVAILABLE'
  | 'PRINT_PERMISSION_DENIED'
  | 'PRINT_COMMAND_FAILED'
  | 'PRINT_UNEXPECTED_ERROR';

type PrintErrorResponse = {
  status: false;
  code: PrintErrorCode;
  msg: string;
  handled?: boolean;
};

@Injectable({ providedIn: 'root' })
export class PdfService {
  constructor() {}

  static generatePdf(params: { oPdf: { data: any; type?: any }; imprimir: boolean }): any {
    return new Promise((resolve, reject) => {
      let obj;
      let todo_true = true;
      const data = fun.deepCloning(params.oPdf.data);
      const type_oPdf = params.oPdf.type;
      const reimprimir = params.oPdf.data.reimprimir ? true : false;
      const config: ConfigI = Ss.configServ.config;

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

            let tipo_pdf = ``;

            if (data.serie == serie.electronica) tipo_pdf = '_electronica';

            obj = options[config.pages_sizes.nota].makePDF(data, 'nota.pdf', 'notas', tipo_pdf);
            break;

          case 'facturacion':
            const file_maker = data.serie == serie.electronica ? facturasCompraVentaElectronica : facturasCompraVenta;

            options = { '80mm_roll': roll80mm, '8.5x5.5': file_maker, '8.5x11': file_maker };
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
          this.createPdfFromBase64(obj.doc, obj.file, reimprimir)
            .then(res => {
              res['pageOrientation'] = obj.pageOrientation;
              if (params.imprimir) {
                this.imprimirBase64({ base64: res.base64, file: res.file, type: type_oPdf, printer: printer_selected, pageOrientation: res['pageOrientation'] })
                  .then(res_impresion => resolve(res_impresion))
                  .catch(err_impresion => reject(err_impresion));
              } else {
                resolve(res);
              }
            })
            .catch(err => reject(params.imprimir ? this.handlePrintError(err) : err));
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

  static async createPdfFromBase64(docDefinition: any, file_: string, reimprimir_: boolean): Promise<any> {
    const [{ default: pdfMake }, { vfs }] = await Promise.all([import('pdfmake/build/pdfmake'), import('../utils/vfs_fonts')]);
    await PdfAutoEllipsis.prepare(docDefinition, vfs);

    return new Promise<any>((resolve, reject) => {
      try {
        const pdfMaker = pdfMake as any;
        pdfMaker.vfs = vfs;
        pdfMaker.fonts = fonts;

        const pdfDocGenerator = pdfMaker.createPdf(docDefinition);
        pdfDocGenerator.getBase64((data: string) => {
          const respuesta = this.makeStatusObj({
            msg: 'Pdf Base64 correcto',
            file: file_,
            status: 'si',
            reimprimir: reimprimir_,
            base64: data,
            dd: docDefinition,
          });

          resolve(respuesta);
        });
      } catch (error) {
        const respuesta = this.makeStatusObj({ msg: 'Error escribiendo el pdf.', status: 'no', body: error });
        reject(respuesta);
      }
    });
  }

  static async imprimirBase64(oBase: { base64: string; file: string; type: string; printer: string; pageOrientation: string }): Promise<any> {
    try {
      if (this.printerNotConfigured(oBase.printer)) {
        throw this.printError('PRINT_PRINTER_NOT_CONFIGURED', 'No hay impresora configurada para este tipo de impresión.');
      }

      const res = await Ss._ipc.printBase64(oBase);
      if (res?.status === false) throw this.normalizePrintError(res);

      res['pageOrientation'] = oBase.pageOrientation;
      return res;
    } catch (error) {
      throw this.handlePrintError(error);
    }
  }

  private static printerNotConfigured(printer: string): boolean {
    return fun.isEmpty(printer) || String(printer).trim() === 'Ninguna';
  }

  private static normalizePrintError(error: any): PrintErrorResponse {
    if (error?.status === false && error?.msg) return this.printError((error.code ?? 'PRINT_UNEXPECTED_ERROR') as PrintErrorCode, error.msg);

    const errorMessage = String(error?.message ?? error?.msg ?? error ?? '').toLowerCase();

    if (errorMessage.includes('object could not be cloned')) {
      return this.printError('PRINT_PAYLOAD_INCOMPLETE', 'Los datos enviados a impresión contienen información no válida.');
    }

    if (errorMessage.includes('escribiendo el pdf') || errorMessage.includes('generando el pdf')) {
      return this.printError('PRINT_PDF_GENERATION_FAILED', 'No se pudo generar el PDF antes de enviarlo a impresión.');
    }

    if (errorMessage.includes('impresora') || errorMessage.includes('printer')) {
      return this.printError('PRINT_PRINTER_NOT_AVAILABLE', 'La impresora configurada no está disponible o no responde.');
    }

    if (errorMessage.includes('pdf') && (errorMessage.includes('not found') || errorMessage.includes('no se encontró'))) {
      return this.printError('PRINT_PDF_NOT_FOUND', 'No se encontró el archivo PDF generado para imprimir.');
    }

    return this.printError('PRINT_UNEXPECTED_ERROR', 'Ocurrió un error inesperado durante el proceso de impresión.');
  }

  private static handlePrintError(error: any): PrintErrorResponse {
    if (error?.status === false && error?.handled) return error;

    const printError = this.normalizePrintError(error);

    if (printError.code === 'PRINT_UNEXPECTED_ERROR') console.error('Error en imprimirBase64:', error);
    fun.toastError(printError.msg, 'ERROR');

    return { ...printError, handled: true };
  }

  private static printError(code: PrintErrorCode, msg: string): PrintErrorResponse {
    return { status: false, code, msg };
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
