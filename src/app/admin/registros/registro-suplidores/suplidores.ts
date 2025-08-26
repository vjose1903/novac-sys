import { CrudG } from '@core/typescript/crud-g';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '@core/services/functions.service';
import { csvConfig as csvConfigSuplidorProd } from '@core/services/reports/excel/configs/report/suplidor_prod';
import * as _ from 'lodash';
import { ICallbackModal, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';

export interface SuplidorI {
  [key: string]: any;
}

export class SuplidorC extends CrudG<any> {
  constructor() {
    super('suplidores');
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  static openModalReporteForm(params: { tipo: any; titulo?: any }) {
    return new Promise<any>((resolve, reject) => {
      const { tipo, titulo } = params;
      const inputs = { tipo_reporte: tipo };

      ReporteC.objReporte = { inputs: inputs, id: tipo, header: titulo, callback: returnDataFromModal };

      function returnDataFromModal(arg: ICallbackModal) {
        if (arg.type != modalCloseType.returnData) return;
        SuplidorC.requestReporte(arg.data, params);
        resolve(arg.data);
      }

      new DynamicModalClass(ReporteC.objReporte).show();
    });
  }

  static requestReporte(reporteParams, pdfParams) {
    const formReporte = reporteParams.data;
    let requestParameters;

    requestParameters = { desde: fun.my_dateFormater(formReporte.desde, false), hasta: fun.my_dateFormater(formReporte.hasta, false), articulo_id: formReporte.articulo_id };

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };
    ReporteC.configCsv = csvConfigSuplidorProd;
    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then(response => {
      let objPdfView = { ...response, titulo: pdfParams.titulo, fileName: _.first(response.file.split('.')) };

      ReporteC.visualizarReporte(objPdfView);
    });
  }
}
