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

        writeLogs(configuration, 'configuration');

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
        console.error(error)
        reject({ success: false, error });
      }
    });
  }
}
