import { EntidadCuentaContableI } from './../../contabilidad/entidad-cuenta-contable/cuenta-contable-form/cuenta-contable-form.utils';
import { CrudG } from '@core/typescript/crud-g';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '@core/services/functions.service';
import { DocumentoDeIdentidadI } from '@core/typescript/documentos_de_identidad.utils';
import { BuscarClienteSuplidorComponent } from '@components/formularios en modales/buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { DateUtils } from '@vjose1903/dateutils';
import { Validators } from '@angular/forms';
import { csvConfig as csvConfigSuplidorProd } from '@core/services/reports/excel/configs/report/suplidor_prod';
import * as _ from 'lodash';
import { ICallbackModal, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';

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

export class SuplidorC extends CrudG<SuplidorI> {
  constructor() {
    super('suplidores');
  }

  static inputsSelectSuplidor = [
    {
      label: 'Seleccione el suplidor',
      formControl: 'suplidor_id',
      items: [],
      optionLabel: 'nombre_completo',
      optionValue: 'id',
      searchFunction: SuplidorC.getSuplidores,
      blurFunction: SuplidorC.cleanSuplidores,
      placeholder: 'Ingrese el nombre del suplidor',
      notFoundText: 'Suplidor no encontrado',
      disabledFunction: () => false,
      validators: Validators.required,
    },
  ];

  static inputsIncludeSaldadas = [
    {
      label: 'Incluir Facturas Saldadas',
      formControl: 'include_pagadas',
      defaultValue: false,
      disabledFunction: () => false,
      validators: Validators.required,
    },
  ];

  static async getSuplidores(name) {
    if (fun.hasValue(name)) {
      fun.awaitTyping().then(res => {
        const extra = { afterPath: `filtro/${name}`, parameters: { paginado: false } };
        new SuplidorC().getAll(extra).then(res => {
          SuplidorC.inputsSelectSuplidor[0].items = Array.isArray(res['data']) ? res['data'] : [];
        });
      });
    } else {
      SuplidorC.inputsSelectSuplidor[0].items = [];
    }
  }

  static async cleanSuplidores() {
    SuplidorC.inputsSelectSuplidor[0].items = [];
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  static openModalReporteForm(params: { tipo: any; titulo?: any }) {
    return new Promise<any>((resolve, reject) => {
      const { tipo, titulo } = params;
      const inputs = { tipo_reporte: tipo };

      // Mantener funcionalidad de cuentas por pagar
      if (tipo == 'cuentas_pagar_suplidor') {
        inputs['dinamyc_selections'] = SuplidorC.inputsSelectSuplidor;
      }

      const reportIncludedInSwitches = ['cuentas_pagar_ant_saldo', 'cuentas_pagar_suplidor'];
      if (reportIncludedInSwitches.includes(tipo)) {
        inputs['dinamyc_switches'] = SuplidorC.inputsIncludeSaldadas;
      }

      function returnDataFromModal(arg: ICallbackModal) {
        if (arg.type != modalCloseType.returnData) return;
        SuplidorC.requestReporte(arg.data, params);
        resolve(arg.data);
      }

      ReporteC.objReporte = { inputs: inputs, id: tipo, header: titulo, callback: returnDataFromModal };

      new DynamicModalClass(ReporteC.objReporte).show();
    });
  }

  static requestReporte(reporteParams, pdfParams) {
    const formReporte = reporteParams.data;
    let objTipo = { cuentas_pagar_suplidor: CxP.por_suplidor, cuentas_pagar_ant_saldo: formReporte.tipo };
    let tipo;
    let requestParameters;

    switch (pdfParams.tipo) {
      case 'cuentas_pagar_suplidor':
      case 'cuentas_pagar_ant_saldo':
        requestParameters = { tipo: objTipo[reporteParams.modalId] };
        tipo = requestParameters['tipo'];

        if (tipo == CxP.por_suplidor) requestParameters['suplidor_id'] = formReporte.suplidor_id;
        requestParameters['desde'] = DateUtils.format({ date: formReporte.desde, dateFormat: 'YYYY-MM-DD' });
        requestParameters['hasta'] = DateUtils.format({ date: formReporte.hasta, dateFormat: 'YYYY-MM-DD' });
        requestParameters['include_pagadas'] = formReporte.include_pagadas ?? false;

        pdfParams.tipo = 'cuentas_pagar';
        break;

      case 'suplidor_prod':
        requestParameters = {
          desde: DateUtils.format({ date: formReporte.desde, dateFormat: 'YYYY-MM-DD' }),
          hasta: DateUtils.format({ date: formReporte.hasta, dateFormat: 'YYYY-MM-DD' }),
          articulo_id: formReporte.articulo_id,
        };
        break;

      default:
        break;
    }

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };
    ReporteC.configCsv = csvConfigSuplidorProd;
    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then(response => {
      let objPdfView = {
        ...response,
        titulo: pdfParams.titulo,
        fileName: response.file.split('.')[0],
        viewerOptions: { width: tipo == CxP.por_suplidor ? '57rem' : '64rem', height: tipo == CxP.por_suplidor ? '76vh' : '47rem' },
      };

      ReporteC.visualizarReporte(objPdfView);
    });
  }

  static reporteCxP(params) {
    // params.inputs['data'] = [];
    // params.inputs['filtrarSuplidor'] = null;
    // params.inputs['metodo'] = 'compra';
    // params.inputs['palabra_a_buscar'] = ' ';
    // let objModal: ConfigureModalI = {
    //   id: params.tipo,
    //   inputs: params.inputs,
    //   header: params.inputs.titulo,
    //   component: BuscarClienteSuplidorComponent,
    //   width: '900px',
    //   height: '500px',
    //   botones: { ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons), cancelar: { show: true, disable: false } },
    // };
    // return objModal;
  }
}

export enum CxP {
  por_suplidor = 1,
  detallado = 2,
  agrupado = 3,
}
