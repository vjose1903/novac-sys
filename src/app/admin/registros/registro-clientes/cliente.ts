import { Permisos } from '@core/typescript/permisos';
import { Ss } from '@core/services/singleton.service';
import { CrudG } from '@core/typescript/crud-g';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '@core/services/functions.service';
import { DateUtils } from '@vjose1903/dateutils';
import { Validators } from '@angular/forms';
import { ReporteViewModalConfigI } from '@core/interface/reporte-view-modal-config';
import { csvConfig as csvConfigCxc } from '@core/services/reports/excel/configs/report/cxc';
import { csvConfig as csvConfigCxcAnt } from '@core/services/reports/excel/configs/report/cxc_ant';
import { csvConfig as csvConfigVentasCliente } from '@core/services/reports/excel/configs/report/ventas_cliente';
import { csvConfig as csvConfigCxcHistorico } from '@core/services/reports/excel/configs/report/cxc_historico';
import { MoraCalculator } from '../../recibos/recibo-ingresos/utils/mora-calculator';
import { ICallbackModal, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';

export enum CxC {
  por_cliente = 1,
  detallado = 2,
  agrupado = 3,
  historico = 4,
}

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

  static inputMostrarPendienteAnterior = {
    label: 'Mostrar saldo al corte anterior',
    formControl: 'mostrar_balance_anterior',
    defaultValue: false,
    disabledFunction: () => false,
    validators: Validators.required,
  };

  static openModalReporteForm(params: { tipo: any; titulo?: any }) {
    return new Promise<any>((resolve, reject) => {
      const { tipo, titulo } = params;
      const inputs = { tipo_reporte: tipo };

      const reportIncludedInSwitches = ['cuentas_cobrar_ant_saldo', 'cuentas_cobrar_cliente'];

      inputs['dynamic_switches'] = [];
      if (reportIncludedInSwitches.includes(tipo)) {
        inputs['dynamic_switches'].push(ClienteC.inputsIncludeSaldadas);
      }

      if (tipo == 'cuentas_cobrar_cliente') {
        inputs['dynamic_switches'].unshift(ClienteC.inputMostrarPendienteAnterior);
        inputs['dynamic_switches'].push(ClienteC.inputsIncludeMora);
      }

      ReporteC.objReporte = { inputs: inputs, id: tipo, header: titulo, callback: returnDataFromModal };

      function returnDataFromModal(arg: ICallbackModal) {
        if (arg.type != modalCloseType.returnData) return;
        ClienteC.requestReporte(arg.data, params);
        resolve(arg.data);
      }

      new DynamicModalClass(ReporteC.objReporte).show();
    });
  }

  static async requestReporte(reporteParams, pdfParams) {
    let hasPermisoPreVenta = await Ss.permissionsService.hasPermission(Object.values(Permisos.pre_venta));
    const formReporte = reporteParams.data;

    let objTipo = { cuentas_cobrar_cliente: CxC.por_cliente, cuentas_cobrar_ant_saldo: formReporte.tipo };
    let tipo;
    let requestParameters;
    let includeMora = formReporte.include_mora ?? false;

    switch (pdfParams.tipo) {
      case 'cuentas_cobrar_cliente':
      case 'cuentas_cobrar_ant_saldo':
        requestParameters = { tipo: reporteParams.data.tipo };
        tipo = requestParameters['tipo'];

        if (tipo == CxC.por_cliente) {
          requestParameters['cliente_id'] = formReporte.cliente_id;
          requestParameters['include_mora'] = includeMora;
        }

        requestParameters['desde'] = DateUtils.format({ date: formReporte.desde, dateFormat: 'YYYY-MM-DD' });
        requestParameters['hasta'] = DateUtils.format({ date: formReporte.hasta, dateFormat: 'YYYY-MM-DD' });
        requestParameters['include_pagadas'] = formReporte.include_pagadas ?? false;

        if (formReporte.mostrar_balance_anterior) {
          requestParameters.tipo = CxC.historico;
          includeMora = false;
          delete requestParameters.include_mora;
          delete requestParameters.include_pagadas;
        }

        if (pdfParams.tipo == 'cuentas_cobrar_cliente') {
          if (formReporte.mostrar_balance_anterior) {
            ReporteC.configCsv = csvConfigCxcHistorico;
          } else {
            ReporteC.configCsv = csvConfigCxc;
          }
        } else if (pdfParams.tipo == 'cuentas_cobrar_ant_saldo') {
          ReporteC.configCsv = csvConfigCxcAnt[tipo == CxC.detallado ? 'detallado' : 'agrupado'];
        }

        pdfParams.tipo = 'cuentas_cobrar';

        break;

      case 'cuentas_con_pagos':
      case 'ventas_cliente':
        requestParameters = { desde: DateUtils.format({ date: formReporte.desde, dateFormat: 'YYYY-MM-DD' }), hasta: DateUtils.format({ date: formReporte.hasta, dateFormat: 'YYYY-MM-DD' }), cliente_id: formReporte.cliente_id };

        if (pdfParams.tipo == 'ventas_cliente') {
          requestParameters['tipo_factura_id'] = formReporte.tipo_factura_id;
          requestParameters['condicion'] = formReporte.condicion;
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
        titulo: pdfParams.titulo,
        ...response,
      };

      ReporteC.visualizarReporte(objPdfView);
    });

    function transformRequestResponse(requestResponse) {
      requestResponse['tipo_reporte'] = requestResponse['tipo_reporte'].replace('cuentas_cobrar', 'cxc');

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
