import { exportExcelColumnsI, exportExcelConfigI } from '../src/app/core/interface/export-to-excel.interface';
import { shell } from 'electron';
import * as path from 'path';
import { parsePath, writeLogs } from '../main';
import Functions from './functions.js';

const ExcelJS = require('exceljs');

export default class ExportToExcel {
  app: Electron.App;

  constructor(app: Electron.App) {
    this.app = app;
  }

  generateCSV(params: { fileName: string; excelData: Array<string[]>; configuration: exportExcelConfigI }) {
    return new Promise(async (resolve, reject) => {
      try {
        const fileName = params.fileName;
        const excelData = params.excelData;
        const configuration = params.configuration;

        const documentsPath = this.app.getPath('documents');
        const targetFolder = path.join(documentsPath, 'NovacSystem');
        const filePath = parsePath(path.join(targetFolder, fileName));
        writeLogs(filePath, 'filePath');

        // TODO: hacer en el configuration un metodo para crear el nombre del seet
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Datos');
        excelData.forEach(row => sheet.addRow(row));

        this.autoFitColumns(sheet);

        configuration.columns.forEach((config: exportExcelColumnsI, index: number) => {
          if (Functions.hasValue(config.bodyFormat)) {
            const currentColumn = sheet.getColumn(index + 1);

            currentColumn.eachCell((cell, rowNumber) => {
              if (rowNumber > 1) cell.numFmt = config.bodyFormat;
            });
          }
        });

        workbook.xlsx.writeFile(filePath).then(() => {
          writeLogs('Archivo Excel creado exitosamente');

          shell
            .openPath(targetFolder)
            .then(() => {
              writeLogs(`Carpeta abierta: ${targetFolder}`);
            })
            .catch(err => {
              writeLogs(err, 'Error al abrir la carpeta:');
              console.error('Error al abrir la carpeta:', err);
            });
        });

        resolve({ success: true, filePath });
      } catch (error) {
        console.error(error);
        reject({ success: false, error });
      }
    });
  }

  /**
   * Ajusta el ancho de las columnas mediante un muestreo aleatorio de celdas.
   */
  private autoFitColumns(worksheet: any, porcentajeMuestra = 10, maxMuestra = 500) {
    worksheet.columns.forEach((column: any) => {
      const totalCeldas = column.values.length - 1;
      const muestra = Math.min(Math.ceil((porcentajeMuestra / 100) * totalCeldas), maxMuestra);

      const indicesAleatorios = new Set<number>();
      while (indicesAleatorios.size < muestra) {
        const randomIndex = Math.floor(Math.random() * totalCeldas) + 1;
        indicesAleatorios.add(randomIndex);
      }

      const maxLength = Array.from(indicesAleatorios).reduce((max, rowIndex) => {
        const cellValue = column.values[rowIndex] ? column.values[rowIndex].toString() : '';
        return Math.max(max, cellValue.length);
      }, 0);

      column.width = maxLength + 2;
    });
  }
}
