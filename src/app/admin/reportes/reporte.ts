import { inputViewerOptions, viewerOptions } from './../components/pdf-viewer/pdf-viewer';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { Ss } from '../../core/services/singleton.service';
import { fun } from '../../core/services/functions.service';
import { CrudG } from '../../core/typescript/crud-g';
import { FormReportesComponent } from '../components/formularios en modales/form-reportes/form-reportes.component';
import { ModalClass } from '../components/modal/modal-class';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';
import * as _ from 'lodash';
import { ConfigI } from '../../core/typescript/config-interface';

export class ReporteC extends CrudG<any> {
  private static _objReporte;

  constructor() {
    super('reportes');
  }

  static set objReporte(params: { width?: string; id?: string; header?: string; botones?: any; inputs?: any; height?: any; returnDataFromModal?: Function }) {
    const obj = {
      component: FormReportesComponent,
      width: '510px',
      id: params.id,
      header: params.header,
      botones: { aceptar: { show: true, disable: false }, cancelar: { show: true, disable: false } },
    };

    if (fun.hasValue(params.inputs)) obj['inputs'] = params.inputs;
    if (fun.hasValue(params.id)) obj['id'] = params.id;
    if (fun.hasValue(params.header)) obj['header'] = params.header;
    if (fun.hasValue(params.botones)) obj['botones'] = params.botones;
    if (fun.hasValue(params.width)) obj['width'] = params.width;
    if (fun.hasValue(params.height)) obj['height'] = params.height;

    if (fun.hasValue(params.returnDataFromModal)) obj['returnDataFromModal'] = params.returnDataFromModal;

    this._objReporte = obj;
  }

  static get objReporte() {
    return this._objReporte;
  }

  static requestReporteAndMakePdf(requestParams, type, transformRequestResponse?) {
    return new Promise<any>((resolve, reject) => {
      new ReporteC().getAll(requestParams).then((responseRequest) => {
        //
        if (fun.hasValue(transformRequestResponse)) responseRequest = transformRequestResponse(responseRequest);

        //

        Ss.loadServ.isLoading.next(true);
        const obj = { data: responseRequest, type: type };

        PdfService.generatePdf({ oPdf: obj, imprimir: false })
          .then(async (result) => {
            Ss.loadServ.isLoading.next(false);
            resolve({ ...result, requestResult: responseRequest });
          })
          .catch(async (err) => {
            Ss.loadServ.isLoading.next(false);
            reject(err);
          });
      });
    });
  }

  static visualizarReporte(objPdfView: { openNewModal: Function; status: string; pageOrientation: string; file: any; base64: any; reimprimir: any; msg: any; titulo: string; viewerOptions: viewerOptions }) {
    objPdfView['viewerOptions'] ??= {};

    if (objPdfView.status == 'no') fun.toastError(objPdfView.msg, 'ERROR');
    else {
      objPdfView.openNewModal({
        component: PdfViewerComponent,
        inputs: objPdfView,
        id: 'reporte_view',
        header: objPdfView.titulo,
        width: objPdfView?.viewerOptions?.width ?? '57rem',
        height: objPdfView?.viewerOptions?.height ?? '76vh',
        botones: {
          ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
          dinamico: [
            { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancel'), label: 'Cerrar', disable: false },
            {
              clase: 'btn btn-verde',
              function: (instance) => this.imprimirPDF(objPdfView, instance),
              label: 'Imprimir',
              disable: false,
            },
          ],
        },
      });
    }

    Ss.loadServ.isLoading.next(false);
  }

  static imprimirPDF(objPdf, modalInstance?) {
    Ss.loadServ.isLoading.next(true);
    Ss.configServ.getConfig({ isPromise: true }).then((configApp: ConfigI) => {
      objPdf['type'] = objPdf.file == 'cuadre.pdf' ? 'cuadre' : 'reporte';

      const entidad = objPdf['type'] == 'reporte' ? 'reporte' : 'cuadre_caja';
      objPdf['printer'] = configApp.printer_selected[entidad];

      PdfService.imprimirBase64(objPdf)
        .then((res) => {
          Ss.loadServ.isLoading.next(false);

          if (res.status === 'si') {
            fun.toastSuccess('Reporte generado correctamente!!', 'CORRECTO');
            if (modalInstance) modalInstance.closeModal(modalInstance.id, 'cancel');
          } else fun.toastError(res.msg, 'ERROR');
        })
        .catch((err) => {
          Ss.loadServ.isLoading.next(false);
          fun.toastError(err.msg, 'ERROR');
        });
    });
  }
}
