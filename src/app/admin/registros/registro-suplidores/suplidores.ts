import { CrudG } from '../../../core/typescript/crud-g';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '../../../core/services/functions.service';
import { csvConfig as csvConfigSuplidorProd } from '../../../core/services/reports/excel/configs/report/suplidor_prod';
import * as _ from 'lodash';


export class SuplidorC extends CrudG<any> {
  constructor() {
    super('suplidores');
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal }) {
    return new Promise<any>((resolve, reject) => {
      ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo, returnDataFromModal: returnDataFromModal };

      params.openNewModal(ReporteC.objReporte);

      function returnDataFromModal(arg) {
        SuplidorC.requestReporte(arg, params);
        resolve(arg);
      }
    });
  }

  static requestReporte(reporteParams, pdfParams) {
    let requestParameters;

    requestParameters = { desde: fun.my_dateFormater(reporteParams.data.desde, false), hasta: fun.my_dateFormater(reporteParams.data.hasta, false),articulo_id: reporteParams.data.articulo_id, };

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };
    ReporteC.configCsv = csvConfigSuplidorProd;
    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
      let objPdfView = { ...response, titulo: pdfParams.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: pdfParams.openNewModal };

      ReporteC.visualizarReporte(objPdfView);
    });
  }
}
