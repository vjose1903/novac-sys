import { Ss } from './../../core/services/singleton.service';
import { PdfService } from './../../core/services/pdf/pdf.service';
import { CuadreCajaC } from './../../core/typescript/cuadre_caja';
import { fun } from './../../core/services/functions.service';
import { ReporteC } from '../reportes/reporte';
import * as _ from 'lodash';

export class CuadreC {
  constructor() {}

  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal; titulo?: any }) {
    return new Promise<any>((resolve, reject) => {
      ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo, returnDataFromModal: returnDataFromModal };

      params.openNewModal(ReporteC.objReporte);

      function returnDataFromModal(arg) {
        CuadreC.requestReporte(arg, params);
        resolve(arg);
      }
    });
  }

  static requestReporte(reporteParams, pdfParams) {
    const requestParams = { parameters: { fecha: fun.my_dateFormater(reporteParams.data.fecha, false) } };

    new CuadreCajaC().createOne({}, requestParams).then((res) => {
      this.parseDataToPdf(res['data']).then(async (cuadre_parsed) => {
        const obj = { data: cuadre_parsed, type: 'cuadre_caja' };

        PdfService.generatePdf({ oPdf: obj, imprimir: false }).then(async (response) => {
          let objPdfView = { ...response, titulo: pdfParams.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: pdfParams.openNewModal, viewerOptions: { height: '40rem' } };
          ReporteC.visualizarReporte(objPdfView);
          Ss.layServ.nextCheckCuadreToday(true);
        });
      });
    });
  }

  static parseDataToPdf(data) {
    return new Promise((resolve) => {
      const data_parsed = fun.remplaceKeyFromJson(data, [{ old_key: 'numero_reporte', new_key: 'numero_documento' }]);

      data_parsed['identificador'] = data_parsed['numero_documento'];
      data_parsed['tipo_pdf'] = 'CUADRE DE CAJA';

      resolve(data_parsed);
    });
  }
}
