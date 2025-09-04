import { ReporteC } from '../reportes/reporte';
import { csvConfig as csvConfigInventario } from '@core/services/reports/excel/configs/report/inventario';
import * as _ from 'lodash';

export class InventarioC {
  constructor() {}

  static openModalReporteForm(params: { tipo: any; titulo?: any }) {
    return new Promise<any>(resolve => {
      const { tipo, titulo } = params;
      const inputs = { tipo_reporte: tipo };

      const requestParams = { afterPath: `custom/${inputs.tipo_reporte}`, parameters: null };

      ReporteC.configCsv = csvConfigInventario;

      ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then(response => {
        let objPdfView = { ...response, titulo: titulo, fileName: _.first(response.file.split('.')) };

        ReporteC.visualizarReporte(objPdfView);
      });
    });
  }
}
