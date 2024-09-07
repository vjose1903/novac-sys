import { Permisos } from './../../../core/typescript/permisos';
import { Ss } from './../../../core/services/singleton.service';
import { CrudG } from '../../../core/typescript/crud-g';
import { BuscarClienteSuplidorComponent } from '../../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { ConfigureModalI, ModalClass } from '../../components/modal/modal-class';
import * as _ from 'lodash';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '../../../core/services/functions.service';
import { DateUtils } from '../../../core/typescript/date.utils';
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
        case 'ventas_cliente':
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
    let hasPermisoPreVenta = await Ss.permissionsService.hasPermission(Object.values(Permisos.pre_venta));

    let objTipo = { cuentas_cobrar_cliente: CxCType.cliente, cuentas_cobrar_ant_saldo: reporteParams.data.tipo };
    let tipo;
    let requestParameters;

    switch (pdfParams.tipo) {
      case 'cuentas_cobrar_cliente':
      case 'cuentas_cobrar_ant_saldo':
        requestParameters = { tipo: objTipo[reporteParams.modal_id] };
        tipo = requestParameters['tipo'];

        if (tipo == CxCType.cliente) requestParameters['cliente_id'] = reporteParams.data.id;
        if (tipo == CxCType.antSaldoAgrupado || tipo == CxCType.antSaldoDetallado) requestParameters['desde'] = DateUtils.format({ date: reporteParams.data.desde, dateFormat: 'YYYY-MM-DD' });
        if (tipo == CxCType.antSaldoAgrupado || tipo == CxCType.antSaldoDetallado) requestParameters['hasta'] = DateUtils.format({ date: reporteParams.data.hasta, dateFormat: 'YYYY-MM-DD' });

        pdfParams.tipo = 'cuentas_cobrar';

        break;

      case 'cuentas_con_pagos':
      case 'ventas_cliente':
        requestParameters = { desde: DateUtils.format({ date: reporteParams.data.desde, dateFormat: 'YYYY-MM-DD' }), hasta: DateUtils.format({ date: reporteParams.data.hasta, dateFormat: 'YYYY-MM-DD' }), cliente_id: reporteParams.data.cliente_id };

        if (pdfParams.tipo == 'ventas_cliente') {
          requestParameters['tipo_factura_id'] = reporteParams.data.tipo_factura_id;
          requestParameters['condicion'] = reporteParams.data.condicion;
          requestParameters['formas_pago'] = "('Efectivo','Tarjeta','Cheque','Transferencia')";
        }

        break;

      default:
        break;
    }

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte', transformRequestResponse).then((response) => {
      let objPdfView = {
        ...response,
        titulo: pdfParams.inputs.titulo,
        fileName: _.first(response.file.split('.')),
        openNewModal: pdfParams.openNewModal,
        viewerOptions: { width: tipo == 1 ? '57rem' : '64rem', height: tipo == 1 ? '76vh' : '47rem' },
      };

      ReporteC.visualizarReporte(objPdfView);
    });

    function transformRequestResponse(requestResponse) {
      if (hasPermisoPreVenta && objTipo['cuentas_cobrar_ant_saldo'] != 3 && pdfParams.tipo != 'ventas_cliente') requestResponse['tipo_reporte'] += '_preventa';

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
      botones: { ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons), cancelar: { show: true, disable: false } },
    };
    return objModal;
  }
}

export enum CxCType {
  cliente = '1',
  antSaldoDetallado = '2',
  antSaldoAgrupado = '3',
}
