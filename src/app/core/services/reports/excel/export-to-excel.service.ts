import { Injectable } from '@angular/core';
import { exportExcelConfigI } from '../../../interface/export-to-excel.interface';
import { Ss } from '../../singleton.service';
import { ConfigI } from '../../../interface/config-interface';
import { MessageTask } from '../../../models/message-task';
import { ELECTRON_EXPORT_CSV } from '../../../../../../electron/shared-electron-angular';
import * as fun_ from '../utils/funciones';

@Injectable({
  providedIn: 'root',
})
export class ExportToExcelService {
  configApp: ConfigI;

  constructor() {
    this.configApp = Ss.configServ.getConfig({ isPromise: false });
  }

  download(config: exportExcelConfigI, exportData: any) {
    return new Promise<void>((resolve, reject) => {
      try {
        Ss.loadServ.isLoading.next(true);

        const headers = config.columns.map(item => item.title);

        const excelData = [headers];

        const csvBody = exportData.contenido_reporte.map((data: any) => {
          return config.columns.map(col => {
            let value = data[col.key];

            if (col.formato_fecha) {
              value = fun_.my_dateFormater(value);
            } else if (col.formato_numero) {
              value = fun_.roundNumberToDecimal(value);
            }

            return value;
          });
        });

        excelData.push(...csvBody);
        console.log('excelData ', excelData);

        const fileName = `${config.fileName(exportData[config.fileNameDataKey])}`;

        this.exportCsv(fileName, excelData, config)
          .then(() => {
            Ss.loadServ.isLoading.next(false);
            resolve();
          })
          .catch(err => {
            console.error(err);
            Ss.loadServ.isLoading.next(false);
            reject(err);
          });
      } catch (error) {
        console.error(error);
        Ss.loadServ.isLoading.next(false);
        reject(error);
      }
    });
  }

  private exportCsv(fileName: string, excelData: Array<string[]>, config: exportExcelConfigI) {
    return new Promise<any>((resolve, reject) => {
      const task = new MessageTask(ELECTRON_EXPORT_CSV, { fileName, excelData, config });

      Ss._ipc
        .sendTask(task)
        .then(res => resolve(res))
        .catch(err => reject(err));
    });
  }
}
