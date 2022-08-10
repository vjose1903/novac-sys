import { CrudG } from '../../../core/typescript/crud-g';
import { BuscarClienteSuplidorComponent } from '../../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { ConfigureModalI, ModalClass } from '../../components/modal/modal-class';
import * as _ from 'lodash';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '../../../core/services/functions.service';
export class ClienteC extends CrudG<any> {
  constructor() {
    super('clientes');
  }

  static openModalFormReporte(params: { tipo: any; inputs: any; configureNewModal }) {
    return new Promise<any>((resolve, reject) => {
      const objModal = params.tipo == 'cuentas_cobrar_cliente' ? ClienteC.reporteCxC(params) : ClienteC.reporteCxCAntSaldo(params);
      objModal['returnDataFromModal'] = returnDataFromModal;

      params.configureNewModal(objModal);

      function returnDataFromModal(arg) {
        ClienteC.requestReporte(arg, params);
        resolve(arg);
      }
    });
  }

  static requestReporte(reporteParams, pdfParams) {
    let objTipo = { cuentas_cobrar_cliente: 1, cuentas_cobrar_ant_saldo: reporteParams.data.tipo };

    const requestParams = { afterPath: 'custom/cuentas_cobrar', parameters: { tipo: objTipo[reporteParams.modal_id] } };

    let tipo = requestParams.parameters.tipo;
    if (tipo == 1) requestParams.parameters['cliente_id'] = reporteParams.data.id;

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
      let objPdfView = { ...response, titulo: pdfParams.inputs.titulo, width: tipo == 1 ? '57rem' : '64rem', height: tipo == 1 ? '76vh' : '47rem', fileName: _.first(response.file.split('.')), configureNewModal: pdfParams.configureNewModal };

      ReporteC.visualizarReporte(objPdfView);
    });
  }

  static reporteCxC(params) {
    params.inputs['data'] = [];
    params.inputs['filtrarCliente'] = null;
    params.inputs['metodo'] = 'venta';
    params.inputs['palabra_a_buscar'] = ' ';

    let objModal: ConfigureModalI = {
      id: params.tipo,
      inputs: params.inputs,
      header: params.inputs.titulo,
      component: BuscarClienteSuplidorComponent,
      width: '900px',
      height: '500px',
      botones: { ...ModalClass.noShowAceptarCancelarButtons, cancelar: { show: true, disable: false } },
    };
    return objModal;
  }

  static reporteCxCAntSaldo(params) {
    ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo };
    return ReporteC.objReporte;
  }
}
