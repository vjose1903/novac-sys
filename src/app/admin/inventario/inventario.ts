import { ReporteC } from '../reportes/reporte';
import { csvConfig as csvConfigInventario } from '@core/services/reports/excel/configs/report/inventario';
import { fun } from '@core/services/functions.service';

export class InventarioC {
  constructor() {}

  static openModalReporteForm(params: { tipo: any; titulo?: any }) {
    return new Promise<any>(resolve => {
      const { tipo, titulo } = params;
      const inputs = { tipo_reporte: tipo };

      const requestParams = { afterPath: `custom/${inputs.tipo_reporte}`, parameters: null };

      ReporteC.configCsv = csvConfigInventario;

      ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then(response => {
        let objPdfView = { ...response, titulo: titulo, fileName: fun.first(fun.split(response.file, '.')) };

        ReporteC.visualizarReporte(objPdfView);
      });
    });
  }
}
