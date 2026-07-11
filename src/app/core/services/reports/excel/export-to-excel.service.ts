import { Injectable } from '@angular/core';
import { exportExcelConfigI } from '../../../interface/export-to-excel.interface';
import { Ss } from '../../singleton.service';
import { ConfigI } from '../../../interface/config-interface';
import * as fun_ from '../utils/funciones';
import { fun } from '../../functions.service';
import { ReportTypeE } from './excel.interfaces';

@Injectable({
  providedIn: 'root',
})
export class ExportToExcelService {
  configApp: ConfigI;

  constructor() {
    this.configApp = Ss.configServ.config
  }

  download(config: exportExcelConfigI, exportData: any) {
    return new Promise<void>((resolve, reject) => {
      try {
        Ss.loadServ.isLoading.next(true);
        const excelData = [];

        this.addTitles(config, excelData);

        this.addRows(config, excelData, exportData);

        const fileName = `${config.fileName(exportData?.[config?.fileNameDataKey], config.prefix)}`;

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

  addTitles(config: exportExcelConfigI, excelData: Array<string[]>) {
    const headers = config.columns.map(item => item.title);

    if (config.type == ReportTypeE.groupTitleInColumn) {
      fun.pushAt(headers, config.titleRowInCols.index, config.titleRowInCols.title);
    }

    excelData.push(headers);
  }

  addRows(config: exportExcelConfigI, excelData: Array<string[]>, exportData: any) {
    const processRowData = (data: any, col: any) => {
      let value = data[col.key];

      if (col.formato_fecha) {
        value = fun_.my_dateFormater(value);
      } else if (col.formato_numero) {
        value = fun_.roundNumberToDecimal(value);
      }

      if (col.nullIfCero && fun.hasValue(value) && Number(value) == 0) return null;

      if (col.uppercase) value = fun.capitalice(value);

      return value;
    };

    let csvBody = [];
    switch (config.type) {
      case ReportTypeE.normal:
        csvBody = exportData.contenido_reporte.map((data: any) => {
          return config.columns.map(col => processRowData(data, col));
        });

        break;
      case ReportTypeE.groupTitleInColumn:
        exportData.contenido_reporte.forEach((contenido: any) => {
          if (contenido.contenido_grupo && contenido.contenido_grupo.length > 0) {
            const contenido_grupo = contenido.contenido_grupo.map((data: any) => {
              const inner_contenido = config.columns.map(col => processRowData(data, col));
              fun.pushAt(inner_contenido, config.titleRowInCols.index, contenido.contenido_titulo);

              return inner_contenido;
            });

            csvBody.push(...contenido_grupo);
          }
        });
        break;
    }

    excelData.push(...csvBody);
  }

  private exportCsv(fileName: string, excelData: Array<string[]>, config: exportExcelConfigI) {
    return new Promise<any>((resolve, reject) => {
      Ss._ipc
        .exportCsv({ fileName, excelData, configuration: config })
        .then(res => resolve(res))
        .catch(err => reject(err));
    });
  }
}
