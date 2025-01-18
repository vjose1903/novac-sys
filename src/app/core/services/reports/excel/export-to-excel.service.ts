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

        const headers = config.columns.map((item) => item.title);

        const csvData = [headers.join(',')];

        const csvBody = exportData.contenido_reporte.map((data: any) => {
          return config.columns
            .map((col) => {
              let value = data[col.key];

              if (col.formato_fecha) {
                value = fun_.my_dateFormater(value);
              } else if (col.formato_numero) {
                value = fun_.roundNumberToDecimal(value);
              }

              return value;
            })
            .join(',');
        });

        csvData.push(...csvBody);

        const csvString = csvData.join('\n');
        const fileName = `${config.fileName(exportData[config.fileNameDataKey])}`;

        this.exportCsv(fileName, csvString)
          .then(() => {
            Ss.loadServ.isLoading.next(false);
            resolve();
          })
          .catch((err) => {
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

  private exportCsv(fileName: string, csvString: string) {
    return new Promise<any>((resolve, reject) => {
      const task = new MessageTask(ELECTRON_EXPORT_CSV, { fileName, csvString });

      Ss._ipc
        .sendTask(task)
        .then((res) => {
          if (res['status'] == 'no') reject(res);
          else {
            resolve(res);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
