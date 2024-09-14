import { fun } from '../../../../core/services/functions.service';
import { CrudG } from '../../../../core/typescript/crud-g';
import { ModalClass } from '../../../components/modal/modal-class';
import { DetalleFacturaComponent } from '../../../manipular facturas/detalle-factura/detalle-factura.component';
import { ReporteC } from '../../../reportes/reporte';
import * as _ from 'lodash';
import { PagoDetalleI } from './pagos-detalles';
import { DateUtils } from '../../../../core/typescript/date.utils';

export interface PagoI {
  id?: number;
  user_id?: number;
  tipo_factura_id?: number;
  suplidor_id?: number;
  total?: number;
  forma_pago?: string;
  numero?: number;
  fecha_equivalente?: string;
  estado?: boolean;
  suplidor?: any;
  user?: any;
  pago_factura_detalles?: Array<PagoDetalleI>;
  total_registros?: any;
  data?: any;
}

export class PagoC extends CrudG<PagoI> {
  constructor() {
    super('pago_facturas');
  }

  modalVerDetalles(data) {
    return {
      component: DetalleFacturaComponent,
      inputs: { data: data },
      id: `detalle_pagos`,
      header: 'Detalles Pagos',
      width: '35rem',
      height: '10rem',
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.dismissModal(instance.id), label: 'Cerrar', disable: false }],
      },
    };
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal }) {
    return new Promise<any>((resolve, reject) => {
      ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo, returnDataFromModal: returnDataFromModal };

      params.openNewModal(ReporteC.objReporte);

      function returnDataFromModal(arg) {
        PagoC.requestReporte(arg, params);
        resolve(arg);
      }
    });
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  static requestReporte(reporteParams, pdfParams) {
    let requestParameters;

    requestParameters = {};

    requestParameters['desde'] = DateUtils.format({ date: reporteParams.data.desde, dateFormat: 'YYYY-MM-DD' });
    requestParameters['hasta'] = DateUtils.format({ date: reporteParams.data.hasta, dateFormat: 'YYYY-MM-DD' });
    requestParameters['order'] = 'ASC';
    requestParameters['tipo'] = reporteParams.data.tipo;

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };
    console.log('requestParams ', requestParams);

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
      let objPdfView = { ...response, titulo: pdfParams.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: pdfParams.openNewModal };

      ReporteC.visualizarReporte(objPdfView);
    });
  }
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  parseDataToPdf(data) {
    return new Promise((resolve) => {
      const data_parsed = fun.remplaceKeyFromJson(data, [
        { old_key: 'numero', new_key: 'identificador' },
        { old_key: 'pago_factura_detalles', new_key: 'contenido_reporte' },
      ]);

      data_parsed['tipo_pdf'] = 'PAGO DE FACTURA';
      data_parsed['numero_documento'] = data_parsed['identificador'];
      data_parsed['usuario'] = data.user.nombre_completo;

      const documento = data.suplidor.documentos_de_identidad.find((documento) => documento.principal == true);
      data_parsed['suplidor']['rnc'] = documento ? documento.documento : '----------';

      data_parsed['contenido_reporte'].map((detalle) => {
        detalle['tipo'] = _.split(detalle.descripcion, ' ')[0];
        detalle['comprobante_fiscal'] = _.split(detalle.descripcion, ' ')[1];
        detalle['fecha'] = `${detalle.descripcion.split(' ')[2]} ${detalle.descripcion.split(' ')[4]}`;
      });

      resolve(data_parsed);
    });
  }
}

export enum TipoPagoReporte {
  detallado = 'detallado',
  agrupado = 'agrupado',
}
