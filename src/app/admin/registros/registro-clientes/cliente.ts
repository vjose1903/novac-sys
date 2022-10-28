import { Permisos } from './../../../core/typescript/permisos';
import { SingletonService } from './../../../core/services/singleton.service';
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



  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal }) {
    return new Promise<any>((resolve, reject) => {
      let objModal;
      switch (params.tipo) {
        case 'cuentas_cobrar_cliente':
          objModal = ClienteC.reporteCxC(params);
          break;
        case 'cuentas_cobrar_ant_saldo':
        case 'cuentas_con_pagos':
          ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo };
          objModal = ReporteC.objReporte;

          break;

        default:
          break;
      }
      objModal['returnDataFromModal'] = returnDataFromModal;

      params.openNewModal(objModal);

      function returnDataFromModal(arg) {
        ClienteC.requestReporte(arg, params);
        resolve(arg);
      }
    });
  }

  static async requestReporte(reporteParams, pdfParams) {
    let hasPermisoPreVenta = await SingletonService.permissionsService.hasPermission(Object.values(Permisos.pre_venta));

    let objTipo = { cuentas_cobrar_cliente: 1, cuentas_cobrar_ant_saldo: reporteParams.data.tipo };
    let tipo;
    let requestParameters;

    switch (pdfParams.tipo) {
      case 'cuentas_cobrar_cliente':
      case 'cuentas_cobrar_ant_saldo':
        requestParameters = { tipo: objTipo[reporteParams.modal_id] };
        tipo = requestParameters['tipo'];
        if (tipo == 1) requestParameters['cliente_id'] = reporteParams.data.id;
        pdfParams.tipo = 'cuentas_cobrar';
        break;

      case 'cuentas_con_pagos':
        requestParameters = { desde: fun.my_dateFormater(reporteParams.data.desde, false), hasta: fun.my_dateFormater(reporteParams.data.hasta, false), cliente_id: reporteParams.data.cliente_id };

        break;

      default:
        break;
    }

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte', transformRequestResponse).then((response) => {
      let objPdfView = { ...response, titulo: pdfParams.inputs.titulo, width: tipo == 1 ? '57rem' : '64rem', height: tipo == 1 ? '76vh' : '47rem', fileName: _.first(response.file.split('.')), openNewModal: pdfParams.openNewModal };

      ReporteC.visualizarReporte(objPdfView);
    });

    function transformRequestResponse(requestResponse) {
      if (hasPermisoPreVenta && objTipo['cuentas_cobrar_ant_saldo'] != 3) requestResponse['tipo_reporte'] += '_preventa';

      return requestResponse;
    }
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
      botones: { ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons), cancelar: { show: true, disable: false } },
    };
    return objModal;
  }
}
