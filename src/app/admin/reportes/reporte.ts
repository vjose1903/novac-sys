import { ReporteBackendResponseI, ReporteViewModalConfigI } from '@core/interface/reporte-view-modal-config';
import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { Ss } from '@core/services/singleton.service';
import { fun } from '@core/services/functions.service';
import { CrudG } from '@core/typescript/crud-g';
import { FormReportesComponent } from '@components/formularios en modales/form-reportes/form-reportes.component';
import { PdfViewerComponent } from '@components/pdf-viewer/pdf-viewer.component';
import { ExportToExcelService } from '@core/services/reports/excel/export-to-excel.service';
import { exportExcelConfigI } from '@core/interface/export-to-excel.interface';
import { IModalConfiguration, modalActionsE } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';

export class ReporteC extends CrudG<any> {
  private static _objReporte;
  private static _configCsv: exportExcelConfigI;

  constructor() {
    super('reportes');
  }

  static set configCsv(config: exportExcelConfigI) {
    this._configCsv = config;
  }

  static get configCsv() {
    return this._configCsv;
  }

  static set objReporte(params: { width?: string; id?: string; header?: string; botones?: any; inputs?: any; height?: any; callback?: Function }) {
    const obj: IModalConfiguration = {
      component: FormReportesComponent,
      width: '38rem',
      id: params.id,
      header: params.header,
      botones: [
        { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cancelar', disable: false },
        { clase: 'btn btn-verde', label: 'Aceptar', disable: false },
      ],
    };

    if (fun.hasValue(params.inputs)) obj['inputs'] = params.inputs;
    if (fun.hasValue(params.id)) obj['id'] = params.id;
    if (fun.hasValue(params.header)) obj['header'] = params.header;
    if (fun.hasValue(params.botones)) obj['botones'] = params.botones;
    if (fun.hasValue(params.width)) obj['width'] = params.width;
    if (fun.hasValue(params.height)) obj['height'] = params.height;

    if (fun.hasValue(params.callback)) obj['callback'] = params.callback;

    this._objReporte = obj;
  }

  static get objReporte() {
    return this._objReporte;
  }

  static requestReporteAndMakePdf(requestParams, type, transformRequestResponse?) {
    return new Promise<any>((resolve, reject) => {
      new ReporteC().getAll(requestParams).then(responseRequest => {
        //
        if (fun.hasValue(transformRequestResponse)) responseRequest = transformRequestResponse(responseRequest);

        //

        Ss.loadServ.isLoading.next(true);
        const obj = { data: responseRequest, type: type };

        PdfService.generatePdf({ oPdf: obj, imprimir: false })
          .then(async result => {
            Ss.loadServ.isLoading.next(false);
            resolve({ ...result, requestResult: responseRequest });
          })
          .catch(async err => {
            Ss.loadServ.isLoading.next(false);
            reject(err);
          });
      });
    });
  }

  static visualizarReporte(objPdfView: ReporteViewModalConfigI) {
    objPdfView['viewerOptions'] ??= {};

    if (objPdfView.status == 'no') {
      fun.toastError(objPdfView.msg, 'ERROR');
    } else {
      const { dd, file, msg, pageOrientation, requestResult, sBase64, sDd, status, titulo, ...inputs } = objPdfView;

      const modalViewReporte: IModalConfiguration = {
        component: PdfViewerComponent,
        inputs: inputs,
        id: 'reporte_view',
        header: objPdfView.titulo,
        width: '57rem',
        height: '75vh',
        botones: [
          { clase: 'btn btn-blanco', action: modalActionsE.close, label: 'Cerrar', disable: false },
          { clase: 'btn btn-verde', label: 'Imprimir', disable: false, function: instance => this.imprimirPDF(objPdfView, instance) },
        ],
      };

      if (fun.hasValue(this._configCsv))
        fun.pushAt(modalViewReporte.botones, 1, {
          clase: 'btn btn-gris',
          function: instance => this.exportCsv(objPdfView.requestResult),
          label: 'Exportar CSV',
          disable: false,
          iconName: 'fa-solid fa-file-excel',
          iconColor: '#5fcf5f',
        });

      new DynamicModalClass(modalViewReporte).show();
    }

    Ss.loadServ.isLoading.next(false);
  }

  static imprimirPDF(objPdf, modalInstance?) {
    Ss.loadServ.isLoading.next(true);
    const printerSelected = Ss.configServ.config.printer_selected;

    objPdf['type'] = objPdf.file == 'cuadre.pdf' ? 'cuadre' : 'reporte';

    const entidad = objPdf['type'] == 'reporte' ? 'reporte' : 'cuadre_caja';
    objPdf['printer'] = printerSelected[entidad];

    PdfService.imprimirBase64(objPdf)
      .then(res => {
        Ss.loadServ.isLoading.next(false);

        fun.toastSuccess('Reporte generado correctamente!!', 'CORRECTO');
        if (modalInstance) modalInstance.close();
      })
      .catch(err => {
        Ss.loadServ.isLoading.next(false);
        fun.toastError(err.msg, 'ERROR');
      });
  }

  static exportCsv(data: ReporteBackendResponseI) {
    const exportToExcelServ = new ExportToExcelService();

    exportToExcelServ
      .download(this._configCsv, data)
      .then(() => {
        fun.toastSuccess('Reporte generado correctamente!!', 'CORRECTO');
      })
      .catch(err => {
        console.error(err);

        if (err.msg) {
          fun.toastError(err.msg, 'ERROR');
        } else {
          fun.toastError('Error al exportar el reporte', 'ERROR');
        }
      });
  }
}
