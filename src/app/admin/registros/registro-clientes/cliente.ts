import { Permisos } from '@core/typescript/permisos';
import { Ss } from '@core/services/singleton.service';
import { CrudG } from '@core/typescript/crud-g';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '@core/services/functions.service';
import { DateUtils } from '@core/typescript/date.utils';
import { Validators } from '@angular/forms';
import { ReporteViewModalConfigI } from '@core/interface/reporte-view-modal-config';
import { csvConfig as csvConfigCxc } from '@core/services/reports/excel/configs/report/cxc';
import { csvConfig as csvConfigCxcAnt } from '@core/services/reports/excel/configs/report/cxc_ant';
import { csvConfig as csvConfigVentasCliente } from '@core/services/reports/excel/configs/report/ventas_cliente';
import { MoraCalculator } from '../../recibos/recibo-ingresos/utils/mora-calculator';

export class ClienteC extends CrudG<any> {
  constructor() {
    super('clientes');
  }

  static inputsIncludeSaldadas = {
    label: 'Incluir Facturas Saldadas',
    formControl: 'include_pagadas',
    defaultValue: false,
    disabledFunction: () => false,
    validators: Validators.required,
  };

  static inputsIncludeMora = {
    label: 'Incluir Mora',
    formControl: 'include_mora',
    defaultValue: true,
    disabledFunction: () => false,
    validators: Validators.required,
  };

  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal }) {
    return new Promise<any>((resolve, reject) => {
      function returnDataFromModal(arg) {
        ClienteC.requestReporte(arg, params);
        resolve(arg);
      }

      const reportIncludedInSwitches = ['cuentas_cobrar_ant_saldo', 'cuentas_cobrar_cliente'];

      params.inputs['dinamyc_switches'] = [];
      if (reportIncludedInSwitches.includes(params.tipo)) {
        params.inputs['dinamyc_switches'].push(ClienteC.inputsIncludeSaldadas);
      }

      if (params.tipo == 'cuentas_cobrar_cliente') {
        params.inputs['dinamyc_switches'].push(ClienteC.inputsIncludeMora);
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
    const includeMora = reporteParams.data.include_mora ?? false;

    switch (pdfParams.tipo) {
      case 'cuentas_cobrar_cliente':
      case 'cuentas_cobrar_ant_saldo':
        requestParameters = { tipo: objTipo[reporteParams.modal_id] };
        tipo = requestParameters['tipo'];

        if (tipo == CxC.por_cliente) {
          requestParameters['cliente_id'] = reporteParams.data.cliente_id;
          requestParameters['include_mora'] = includeMora;
        }

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
        ...response,
      };

      ReporteC.visualizarReporte(objPdfView);
    });

    function transformRequestResponse(requestResponse) {
      if (hasPermisoPreVenta && objTipo['cuentas_cobrar_ant_saldo'] != 3 && pdfParams.tipo != 'ventas_cliente') requestResponse['tipo_reporte'] += '_preventa';
      if (includeMora) {
        requestResponse['tipo_reporte'] += '_mora';

        let mora = 0;
        let total_general = 0;


        requestResponse.contenido_reporte.map(factura => {
          factura.balance = factura.total_pendiente;
          const mora_calculator = new MoraCalculator(factura);
          factura.total_mora = fun.desformatearStNumber(mora_calculator.getMora({ porcentaje: 2, formateado: true }));

          factura.total_calculado = factura.total_mora + factura.total_pendiente;

          mora += factura.total_mora;
          total_general += factura.total_calculado;

          return factura;
        });

        requestResponse.total_pendiente = requestResponse.total;
        delete requestResponse.total;

        requestResponse.mora = mora;
        requestResponse.total_general = total_general;
      }

      return requestResponse;
    }
  }
}

export enum CxC {
  por_cliente = 1,
  detallado = 2,
  agrupado = 3,
}
