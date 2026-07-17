import * as fs from 'fs';
import { pathAdd, runTerminalCommand, writeLogs, isMacOs } from '../main.js';
import Functions from './functions.js';
import { BrowserWindow } from 'electron';

type PrintErrorCode =
  | 'PRINT_PRINTER_NOT_CONFIGURED'
  | 'PRINT_PAYLOAD_INCOMPLETE'
  | 'PRINT_INVALID_PDF'
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
};

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
  public async generatePdfFileFromBase64(params: PrintParams): Promise<any> {
    try {
      const validationError = this.validatePrintParams(params);
      if (validationError) throw validationError;

      const pdfFileName = await pathAdd(`/${params.fileName}`);

      try {
        await fs.promises.writeFile(pdfFileName, params.base64, { encoding: 'base64' });
      } catch (error) {
        throw this.getWriteFileError(error as NodeJS.ErrnoException);
      }

      return await this.printPdf({
        fileName: params.fileName,
        tipo: params.type,
        pageOrientation: params.pageOrientation,
        printer: params.printer,
      });
    } catch (error) {
      if (this.isPrintError(error)) throw error;

      throw this.printError('PRINT_UNEXPECTED_ERROR', 'Ocurrió un error inesperado preparando el PDF para impresión.');
    }
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // IMPRIMIR EL PDF
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  public async printPdf(params: PrintFileParams): Promise<any> {
    try {
      const file_path = await pathAdd(`/${params.fileName}`);

      writeLogs(`VOY A IMPRIMIR EL ARCHIVO ---> ${file_path}`);
      let comando = '';

      if (!fs.existsSync(file_path)) {
        throw this.printError('PRINT_PDF_NOT_FOUND', 'No se encontró el archivo PDF generado para imprimir.');
      }

      const fileStats = fs.statSync(file_path);
      if (!fileStats.isFile() || fileStats.size === 0) {
        throw this.printError('PRINT_INVALID_PDF', 'El archivo PDF generado no es válido para impresión.');
      }

      const printerAvailable = await this.printerIsAvailable(params.printer);
      if (!printerAvailable) {
        throw this.printError('PRINT_PRINTER_NOT_AVAILABLE', 'La impresora configurada no está disponible en este equipo.');
      }

      if (isMacOs()) {
        // Comando para macOS usando lp
        comando = `lp -o ${params.pageOrientation} -o ColorModel=RGB -o fit-to-page -d "${params.printer}" "${file_path}"`;
      } else {
        // Comando para Windows usando gsprint
        const gsprint_path = await pathAdd(`/print/gsprint.exe`);
        const ghostscript_path = await pathAdd(`/print/gswin64c.exe`);

        if (!fs.existsSync(gsprint_path) || !fs.existsSync(ghostscript_path)) {
          throw this.printError('PRINT_ENGINE_NOT_FOUND', 'No se encontraron los archivos necesarios para imprimir en Windows.');
        }

        comando = `"${gsprint_path}" -${params.pageOrientation} -colour -ghostscript "${ghostscript_path}" -dPDFFitPage -printer "${params.printer}" "${file_path}"`;
      }

      const res = await runTerminalCommand(comando);
      return { msg: 'PDF impreso correctamente!!', STDOUT: res };
    } catch (error) {
      if (this.isPrintError(error)) throw error;

      throw this.getPrintCommandError(error);
    }
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

  private printerNotConfigured(printer: string): boolean {
    return Functions.isEmpty(printer) || String(printer).trim() === 'Ninguna';
  }

  private validatePrintParams(params: PrintParams): PrintErrorResponse | null {
    if (this.printerNotConfigured(params.printer)) {
      return this.printError('PRINT_PRINTER_NOT_CONFIGURED', 'No hay impresora configurada para este tipo de impresión.');
    }

    if (Functions.isEmpty(params.fileName) || Functions.isEmpty(params.base64)) {
      return this.printError('PRINT_PAYLOAD_INCOMPLETE', 'Faltan datos necesarios para imprimir el PDF.');
    }

    if (!this.isValidPdfBase64(params.base64)) {
      return this.printError('PRINT_INVALID_PDF', 'El PDF generado no tiene un formato válido para impresión.');
    }

    return null;
  }

  private isValidPdfBase64(base64: string): boolean {
    try {
      const normalizedBase64 = base64.includes(',') ? base64.split(',').pop() : base64;
      const buffer = Buffer.from(normalizedBase64, 'base64');

      return buffer.length > 4 && buffer.subarray(0, 4).toString() === '%PDF';
    } catch (error) {
      return false;
    }
  }

  private async printerIsAvailable(printer: string): Promise<boolean> {
    try {
      const printers = await this.getPrinters();
      if (printers.length === 0) return true;

      return printers.includes(printer);
    } catch (error) {
      return true;
    }
  }

  private getWriteFileError(error: NodeJS.ErrnoException): PrintErrorResponse {
    if (error?.code === 'EACCES' || error?.code === 'EPERM') {
      return this.printError('PRINT_WRITE_PERMISSION', 'No hay permisos para crear el archivo PDF de impresión.');
    }

    if (error?.code === 'ENOSPC') {
      return this.printError('PRINT_WRITE_DISK_SPACE', 'No hay espacio suficiente para crear el archivo PDF de impresión.');
    }

    return this.printError('PRINT_WRITE_FAILED', 'No se pudo crear el archivo PDF de impresión.');
  }

  private getPrintCommandError(error: any): PrintErrorResponse {
    const errorText = `${error?.msg?.message ?? error?.msg ?? ''} ${error?.STDERR ?? ''} ${error?.STDOUT ?? ''}`.toLowerCase();

    if (errorText.includes('permission denied') || errorText.includes('access denied') || errorText.includes('eperm') || errorText.includes('eacces')) {
      return this.printError('PRINT_PERMISSION_DENIED', 'El sistema no tiene permisos para enviar el PDF a la impresora.');
    }

    if (
      errorText.includes('unknown destination') ||
      errorText.includes('printer not found') ||
      errorText.includes('printer not available') ||
      errorText.includes('unable to connect') ||
      errorText.includes('not responding') ||
      errorText.includes('offline') ||
      errorText.includes('impresora no')
    ) {
      return this.printError('PRINT_PRINTER_NOT_AVAILABLE', 'La impresora configurada no está disponible o no responde.');
    }

    if (errorText.includes('no such file') || errorText.includes('not found') || errorText.includes('not recognized') || errorText.includes('enoent')) {
      return this.printError('PRINT_ENGINE_NOT_FOUND', 'No se encontró el programa requerido para enviar el PDF a impresión.');
    }

    return this.printError('PRINT_COMMAND_FAILED', 'El sistema no pudo enviar el PDF a la impresora.');
  }

  private isPrintError(error: any): error is PrintErrorResponse {
    return error?.status === false && Boolean(error?.code) && Boolean(error?.msg);
  }

  private printError(code: PrintErrorCode, msg: string): PrintErrorResponse {
    return { status: false, code, msg };
  }
}
