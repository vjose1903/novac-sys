import { ReporteC } from '../reportes/reporte';
import { csvConfig as csvConfigInventario } from '../../core/services/reports/excel/configs/report/inventario';
import * as _ from 'lodash';

export class InventarioC {
  constructor() {}

  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal; titulo?: any }) {
    return new Promise<any>((resolve) => {
      const requestParams = { afterPath: `custom/${params.tipo}`, parameters: null };

      ReporteC.configCsv = csvConfigInventario;

      ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
        let objPdfView = { ...response, titulo: params.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: params.openNewModal };

        ReporteC.visualizarReporte(objPdfView);
      });
    });
  }
}
