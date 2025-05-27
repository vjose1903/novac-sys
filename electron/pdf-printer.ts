import * as fs from 'fs';
import { pathAdd, runTerminalCommand, writeLogs, isMacOs } from '../main.js';
import Functions from './functions.js';
import { BrowserWindow } from 'electron';

export interface PrintParams {
  fileName: string;
  base64: string;
  type: string;
  pageOrientation: string;
  printer: string;
}

export interface PrintFileParams {
  fileName: string;
  tipo: string;
  pageOrientation: string;
  printer: string;
}

export default class PdfPrinter {
  private static instance: PdfPrinter;
  private win: BrowserWindow;

  constructor(win: BrowserWindow) {
    this.win = win;
  }

  // Singleton pattern similar a otras clases del proyecto
  public static getInstance(win: BrowserWindow): PdfPrinter {
    if (!PdfPrinter.instance) {
      PdfPrinter.instance = new PdfPrinter(win);
    }
    return PdfPrinter.instance;
  }

  public async getPrinters(): Promise<string[]> {
    try {
      const printers = await this.win?.webContents.getPrintersAsync();
      return printers?.map(printer => printer.name) ?? [];
    } catch (error) {
      writeLogs(`Error obteniendo impresoras: ${error}`);
      return [];
    }
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // GENERAR EL PDF DESDE BASE64 E IMPRIMIR
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  public generatePdfFileFromBase64(params: PrintParams): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (params.printer == 'Ninguna' || Functions.isEmpty(params.printer)) {
        return reject({ msg: 'Impresora no especificada. Seleccione un dispositivo de impresión para continuar', status: false });
      }

      const pdfFileName = await pathAdd(`/${params.fileName}`);

      try {
        fs.writeFile(pdfFileName, params.base64, { encoding: 'base64' }, () => {
          this.printPdf({
            fileName: params.fileName,
            tipo: params.type,
            pageOrientation: params.pageOrientation,
            printer: params.printer,
          })
            .then(res => resolve(res))
            .catch(err => reject(err));
        });
      } catch (err) {
        reject({ msg: 'Error generando reporte!!', status: false, error: err });
      }
    });
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // IMPRIMIR EL PDF
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  public printPdf(params: PrintFileParams): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const file_path = await pathAdd(`/${params.fileName}`);

      writeLogs(`VOY A IMPRIMIR EL ARCHIVO ---> ${file_path}`);
      let comando = '';

      if (isMacOs()) {
        // Comando para macOS usando lp
        comando = `lp -o ${params.pageOrientation} -o ColorModel=RGB -o fit-to-page -d "${params.printer}" "${file_path}"`;
      } else {
        // Comando para Windows usando gsprint
        const gsprint_path = await pathAdd(`/print/gsprint.exe`);
        const ghostscript_path = await pathAdd(`/print/gswin64c.exe`);

        comando = `${gsprint_path} -${params.pageOrientation} -colour -ghostscript "${ghostscript_path}" -dPDFFitPage -printer "${params.printer}" "${file_path}"`;
      }

      runTerminalCommand(comando)
        .then(res => {
          resolve({ msg: 'PDF impreso correctamente!!', STDOUT: res });
        })
        .catch(err => reject({ msg: 'Error imprimiendo PDF!!', err }));
    });
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // MÉTODO PARA SOLO GENERAR PDF SIN IMPRIMIR (OPCIONAL)
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  public generatePdfFile(params: { fileName: string; base64: string }): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const pdfFileName = await pathAdd(`/${params.fileName}`);

      try {
        fs.writeFile(pdfFileName, params.base64, { encoding: 'base64' }, err => {
          if (err) {
            reject({ msg: 'Error generando archivo PDF!!', status: false, error: err });
          } else {
            writeLogs(`PDF generado exitosamente: ${pdfFileName}`);
            resolve(pdfFileName);
          }
        });
      } catch (err) {
        reject({ msg: 'Error generando archivo PDF!!', status: false, error: err });
      }
    });
  }
}
