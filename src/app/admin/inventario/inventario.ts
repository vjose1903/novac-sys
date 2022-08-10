import { ReporteC } from '../reportes/reporte';
import * as _ from 'lodash';

export class InventarioC {
  constructor() {}

  static openModalFormReporte(params: { tipo: any; inputs: any; configureNewModal; titulo?: any }) {
    return new Promise<any>((resolve) => {
      const requestParams = { afterPath: `custom/${params.tipo}`, parameters: null };

      ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
        let objPdfView = { ...response, titulo: params.inputs.titulo, height: '76vh', fileName: _.first(response.file.split('.')), configureNewModal: params.configureNewModal };

        ReporteC.visualizarReporte(objPdfView);
      });
    });
  }
}
