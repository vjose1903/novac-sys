import { Permisos } from './../../../core/typescript/permisos';
import { Ss } from './../../../core/services/singleton.service';
import { CrudG } from '../../../core/typescript/crud-g';
import { BuscarClienteSuplidorComponent } from '../../components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { ConfigureModalI, ModalClass } from '../../components/modal/modal-class';
import * as _ from 'lodash';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '../../../core/services/functions.service';
import { DateUtils } from '../../../core/typescript/date.utils';
import { Validators } from '@angular/forms';
import { ReporteViewModalConfigI } from '../../../core/interface/reporte-view-modal-config';
import { csvConfig as csvConfigCxc } from '../../../core/services/reports/excel/configs/report/cxc';
import { csvConfig as csvConfigCxcAnt } from '../../../core/services/reports/excel/configs/report/cxc_ant';
import { csvConfig as csvConfigVentasCliente } from '../../../core/services/reports/excel/configs/report/ventas_cliente';

export class ClienteC extends CrudG<any> {
  constructor() {
    super('clientes');
  }

  static inputsIncludeSaldadas = [
    {
      label: 'Incluir Facturas Saldadas',
      formControl: 'include_pagadas',
      defaultValue: false,
      disabledFunction: () => false,
      validators: Validators.required,
    },
  ];

  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal }) {
    return new Promise<any>((resolve, reject) => {
      function returnDataFromModal(arg) {
        ClienteC.requestReporte(arg, params);
        resolve(arg);
      }

      const reportIncludedInSwitches = ['cuentas_cobrar_ant_saldo', 'cuentas_cobrar_cliente'];

      if (reportIncludedInSwitches.includes(params.tipo)) {
        params.inputs['dinamyc_switches'] = ClienteC.inputsIncludeSaldadas;
      }

      ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo };
      let objModal = ReporteC.objReporte;

      objModal['returnDataFromModal'] = returnDataFromModal;

      params.openNewModal(objModal);
    });
  }

  static async requestReporte(reporteParams, pdfParams) {
    let hasPermisoPreVenta = await Ss.permissionsService.hasPermission(Object.values(Permisos.pre_venta));

    let objTipo = { cuentas_cobrar_cliente: CxC.por_cliente, cuentas_cobrar_ant_saldo: reporteParams.data.tipo };
    let tipo;
    let requestParameters;

    switch (pdfParams.tipo) {
      case 'cuentas_cobrar_cliente':
      case 'cuentas_cobrar_ant_saldo':
        requestParameters = { tipo: objTipo[reporteParams.modal_id] };
        tipo = requestParameters['tipo'];

        if (tipo == CxC.por_cliente) requestParameters['cliente_id'] = reporteParams.data.cliente_id;
        requestParameters['desde'] = DateUtils.format({ date: reporteParams.data.desde, dateFormat: 'YYYY-MM-DD' });
        requestParameters['hasta'] = DateUtils.format({ date: reporteParams.data.hasta, dateFormat: 'YYYY-MM-DD' });
        requestParameters['include_pagadas'] = reporteParams.data.include_pagadas ?? false;

        if (pdfParams.tipo == 'cuentas_cobrar_cliente') {
          ReporteC.configCsv = csvConfigCxc;
        } else if (pdfParams.tipo == 'cuentas_cobrar_ant_saldo') {
          ReporteC.configCsv = csvConfigCxcAnt[tipo == CxC.detallado ? 'detallado' : 'agrupado'];
        }

        pdfParams.tipo = 'cuentas_cobrar';

        break;

      case 'cuentas_con_pagos':
      case 'ventas_cliente':
        requestParameters = { desde: DateUtils.format({ date: reporteParams.data.desde, dateFormat: 'YYYY-MM-DD' }), hasta: DateUtils.format({ date: reporteParams.data.hasta, dateFormat: 'YYYY-MM-DD' }), cliente_id: reporteParams.data.cliente_id };

        if (pdfParams.tipo == 'ventas_cliente') {
          requestParameters['tipo_factura_id'] = reporteParams.data.tipo_factura_id;
          requestParameters['condicion'] = reporteParams.data.condicion;
          requestParameters['formas_pago'] = "('Efectivo','Tarjeta','Cheque','Transferencia')";

          ReporteC.configCsv = csvConfigVentasCliente;
        }
        break;

      default:
        break;
    }

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte', transformRequestResponse).then(response => {
      let objPdfView: ReporteViewModalConfigI = {
        titulo: pdfParams.inputs.titulo,
        openNewModal: pdfParams.openNewModal,
        viewerOptions: { width: tipo == 1 ? '57rem' : '64rem', height: tipo == 1 ? '76vh' : '47rem' },
        ...response,
      };

      ReporteC.visualizarReporte(objPdfView);
    });

    function transformRequestResponse(requestResponse) {
      if (hasPermisoPreVenta && objTipo['cuentas_cobrar_ant_saldo'] != 3 && pdfParams.tipo != 'ventas_cliente') requestResponse['tipo_reporte'] += '_preventa';

      return requestResponse;
    }
  }
}

export enum CxC {
  por_cliente = 1,
  detallado = 2,
  agrupado = 3,
}
