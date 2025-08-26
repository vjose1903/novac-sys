import { CrudG } from '@core/typescript/crud-g';
import { SuplidorI } from '../../registros/registro-suplidores/suplidores';

export interface FacturasRecibidasI {
  id: number;
  eNCF: string;
  rnc_emisor: string;
  rnc_comprador: string;
  monto_total: number;
  estado: number;
  detalleMotivoRechazo: null;
  suplidor_id?: number;
  suplidor?: SuplidorI;
}

export class FacturasRecibidasC extends CrudG<FacturasRecibidasI> {
  constructor() {
    super('ecf_receptions');
  }

  static openModalReporteForm(params: { tipo: any; titulo?: any }) {
    // return new Promise<any>((resolve, reject) => {
    //   let objModal;
    //   switch (params.tipo) {
    //     case 'ventas_productos':
    //       ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.titulo, returnDataFromModal: returnDataFromModal };
    //       objModal = ReporteC.objReporte;
    //       break;
    //     default:
    //       break;
    //   }
    //   params.openNewModal(objModal);
    //   function returnDataFromModal(arg) {
    //     ArticuloC.requestReporte(arg, params);
    //     resolve(arg);
    //   }
    // });
  }

  static requestReporte(reporteParams, pdfParams) {
    // let requestParameters;
    // switch (pdfParams.tipo) {
    //   case 'ventas_productos':
    //     if (reporteParams.data.tipo == ReportDateTypeE.one_day) requestParameters = { desde: fun.my_dateFormater(reporteParams.data.fecha, false) };
    //     else requestParameters = { desde: fun.my_dateFormater(reporteParams.data.desde, false), hasta: fun.my_dateFormater(reporteParams.data.hasta, false) };
    //     ReporteC.configCsv = ventas_producto_csvConfig;
    //     break;
    //   default:
    //     break;
    // }
    // const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };
    // ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then(response => {
    //   let objPdfView = { ...response, titulo: pdfParams.titulo, fileName: _.first(response.file.split('.')), openNewModal: pdfParams.openNewModal };
    //   ReporteC.visualizarReporte(objPdfView);
    // });
  }
}
