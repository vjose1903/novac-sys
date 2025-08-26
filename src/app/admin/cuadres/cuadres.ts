import { Ss } from '@core/services/singleton.service';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { CuadreCajaC } from '@core/typescript/cuadre_caja';
import { fun } from '@core/services/functions.service';
import { ReporteC } from '../reportes/reporte';
import * as _ from 'lodash';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { ICallbackModal, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';

export class CuadreC {
  constructor() {}

  static openModalReporteForm(params: { tipo: any; titulo?: any }) {
    return new Promise<any>((resolve, reject) => {
      const { tipo, titulo } = params;
      const inputs = { tipo_reporte: tipo };

      ReporteC.objReporte = { inputs: inputs, id: tipo, header: titulo, callback: returnDataFromModal };

      function returnDataFromModal(arg: ICallbackModal) {
        if (arg.type != modalCloseType.returnData) return;

        CuadreC.requestReporte(arg.data, params);
        resolve(arg.data);
      }

      new DynamicModalClass(ReporteC.objReporte).show();
    });
  }

  static requestReporte(reporteParams, pdfParams) {
    const formReporte = reporteParams.data;
    const requestParams = { parameters: { fecha: fun.my_dateFormater(formReporte.fecha, false) } };

    new CuadreCajaC().createOne({}, requestParams).then(res => {
      this.parseDataToPdf(res['data']).then(async cuadre_parsed => {
        const obj = { data: cuadre_parsed, type: 'cuadre_caja' };

        PdfService.generatePdf({ oPdf: obj, imprimir: false }).then(async response => {
          let objPdfView = { ...response, titulo: pdfParams.titulo, fileName: _.first(response.file.split('.')) };
          ReporteC.visualizarReporte(objPdfView);
          Ss.layServ.nextCheckCuadreToday(true);
        });
      });
    });
  }

  static parseDataToPdf(data) {
    return new Promise(resolve => {
      const data_parsed = fun.remplaceKeyFromJson(data, [{ old_key: 'numero_reporte', new_key: 'numero_documento' }]);

      data_parsed['identificador'] = data_parsed['numero_documento'];
      data_parsed['tipo_pdf'] = 'CUADRE DE CAJA';

      resolve(data_parsed);
    });
  }
}
