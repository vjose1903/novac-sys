import { CrudG } from '@core/typescript/crud-g';
import { FacturasI } from '../../facturacion/factura';
import { SuplidorI } from '@registros/registro-suplidores/suplidores';

export interface CommertialApprovalI {
  id: number;
  eNCF: string;
  rnc_emisor: string;
  rnc_comprador: string;
  monto_total: number;
  estado: number;
  detalleMotivoRechazo: null;
  cabecera_factura_id?: number;
  cabecera_factura?: FacturasI;
  suplidor_id?: number;
  suplidor?: SuplidorI;
}

export class CommertialApprovalC extends CrudG<CommertialApprovalI> {
  constructor() {
    super('commertial_approval_receptions');
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
