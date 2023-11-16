import { EntidadCuentaContableI } from './../../contabilidad/entidad-cuenta-contable/cuenta-contable-form/cuenta-contable-form.utils';
import { CrudG } from '../../../core/typescript/crud-g';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '../../../core/services/functions.service';
import * as _ from 'lodash';
import { DocumentoDeIdentidadI } from '../../../core/typescript/documentos_de_identidad.utils';
import { IModalConfiguration, ModalClass } from '../../components/modal/modal-class';
import { BuscarClienteSuplidorComponent } from '../../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';

export class SuplidorC extends CrudG<any> {
  constructor() {
    super('suplidores');
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal }) {
    return new Promise<any>((resolve, reject) => {
      let objModal;

      switch (params.tipo) {
        case 'cuentas_pagar_suplidor':
          objModal = SuplidorC.reporteCxP(params);
          break;
        case 'cuentas_pagar_ant_saldo':
        case 'suplidor_prod':
          ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo };
          objModal = ReporteC.objReporte;
          break;

        default:
          break;
      }

      objModal['returnDataFromModal'] = returnDataFromModal;

      params.openNewModal(objModal);

      function returnDataFromModal(arg) {
        SuplidorC.requestReporte(arg, params);
        resolve(arg);
      }
    });
  }

  static requestReporte(reporteParams, pdfParams) {
    let objTipo = { cuentas_pagar_suplidor: CxP.por_suplidor, cuentas_pagar_ant_saldo: reporteParams.data.tipo };
    let tipo;
    let requestParameters;

    switch (pdfParams.tipo) {
      case 'cuentas_pagar_suplidor':
      case 'cuentas_pagar_ant_saldo':
        requestParameters = { tipo: objTipo[reporteParams.modalId] };
        tipo = requestParameters['tipo'];
        if (tipo == CxP.por_suplidor) requestParameters['suplidor_id'] = reporteParams.data.id;
        pdfParams.tipo = 'cuentas_pagar';
        break;

      case 'suplidor_prod':
        requestParameters = { desde: fun.my_dateFormater(reporteParams.data.desde, false), hasta: fun.my_dateFormater(reporteParams.data.hasta, false), articulo_id: reporteParams.data.articulo_id };
        break;

      default:
        break;
    }

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
      let objPdfView = {
        ...response,
        titulo: pdfParams.inputs.titulo,
        fileName: _.first(response.file.split('.')),
        openNewModal: pdfParams.openNewModal,
        viewerOptions: { width: tipo == CxP.por_suplidor ? '57rem' : '64rem', height: tipo == CxP.por_suplidor ? '76vh' : '47rem' },
      };

      ReporteC.visualizarReporte(objPdfView);
    });
  }

  static reporteCxP(params) {
    params.inputs['data'] = [];
    params.inputs['filtrarSuplidor'] = null;
    params.inputs['metodo'] = 'compra';
    params.inputs['palabra_a_buscar'] = ' ';

    let objModal: IModalConfiguration = {
      id: params.tipo,
      inputs: params.inputs,
      header: params.inputs.titulo,
      component: BuscarClienteSuplidorComponent,
      width: '900px',
      height: '500px',
      botones: { ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons), cancelar: { show: true, disable: false } },
    };
    return objModal;
  }
}

export enum CxP {
  por_suplidor = 1,
  detallado = 2,
  agrupado = 3,
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
