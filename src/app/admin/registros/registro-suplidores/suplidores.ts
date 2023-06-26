import { EntidadCuentaContableI } from './../../contabilidad/entidad-cuenta-contable/cuenta-contable-form/cuenta-contable-form.utils';
import { CrudG } from '../../../core/typescript/crud-g';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '../../../core/services/functions.service';
import * as _ from 'lodash';
import { DocumentoDeIdentidadI } from '../../../core/typescript/documentos_de_identidad.utils';

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

    requestParameters = { desde: fun.my_dateFormater(reporteParams.data.desde, false), hasta: fun.my_dateFormater(reporteParams.data.hasta, false), articulo_id: reporteParams.data.articulo_id };

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
      let objPdfView = { ...response, titulo: pdfParams.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: pdfParams.openNewModal };

      ReporteC.visualizarReporte(objPdfView);
    });
  }
}

export interface SuplidorI {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  email: null;
  estado: boolean;
  nombre_completo?: string;
  documentos_de_identidad: DocumentoDeIdentidadI[];
  cuentas_contables?: EntidadCuentaContableI[];
  documento_identidad: string;
  codigo: string;
  [nombreProp: string]: any;
}
