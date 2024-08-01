import { DateUtils } from '../../../../core/typescript/date.utils';
import { fun } from '../../../../core/services/functions.service';
import { CrudG } from '../../../../core/typescript/crud-g';
import { ModalClass } from '../../../components/modal/modal-class';
import { DetalleFacturaComponent } from '../../../manipular facturas/detalle-factura/detalle-factura.component';
import { ReporteC } from '../../../reportes/reporte';
import * as _ from 'lodash';

export interface ReciboI {
  id?: number;
  user_id?: number;
  tipo_factura_id?: number;
  cliente_id?: number;
  total?: number;
  forma_pago?: string;
  numero_recibo?: number;
  incidencia?: null;
  devuelta?: number;
  fecha_equivalente?: string;
  estado?: boolean;
  cliente?: any;
  user?: any;
  detalle_recibos?: any;
  // camiones_viajes?: any;
  // choferes_viajes?: any;
  total_registros?: any;
  data?: any;
}

export class ReciboC extends CrudG<ReciboI> {
  constructor() {
    super('recibos_ingresos');
  }

  modalVerDetalles(data) {
    return {
      component: DetalleFacturaComponent,
      inputs: { data: data },
      id: `detalle_recibos`,
      header: 'Detalles Recibos',
      width: '37rem',
      height: '10rem',
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [{ clase: 'btn btn-blanco', function: (instance) => instance.dismissModal(instance.id), label: 'Cerrar', disable: false }],
      },
    };
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal }) {
    return new Promise<any>((resolve, reject) => {
      ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo, returnDataFromModal: returnDataFromModal };

      params.openNewModal(ReporteC.objReporte);

      function returnDataFromModal(arg) {
        ReciboC.requestReporte(arg, params);
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

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
      let objPdfView = { ...response, titulo: pdfParams.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: pdfParams.openNewModal };

      ReporteC.visualizarReporte(objPdfView);
    });
  }
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  parseDataToPdf(data) {
    return new Promise((resolve) => {
      const data_parsed = fun.remplaceKeyFromJson(data, [
        { old_key: 'numero_recibo', new_key: 'identificador' },
        { old_key: 'detalle_recibos', new_key: 'contenido_reporte' },
      ]);

      data_parsed['tipo_pdf'] = 'RECIBO DE INGRESOS';
      data_parsed['numero_documento'] = data_parsed['identificador'];
      data_parsed['usuario'] = data.user.nombre_completo;

      const documento = data.cliente.documentos_de_identidad.find((documento) => documento.principal == true);
      data_parsed['cliente']['rnc'] = documento ? documento.documento : '----------';

      data_parsed['contenido_reporte'].map((detalle) => {
        detalle['tipo'] = detalle.descripcion.split(' ')[0];
        detalle['comprobante_fiscal'] = detalle.descripcion.split(' ')[1];
        detalle['fecha'] = `${detalle.descripcion.split(' ')[2]} ${detalle.descripcion.split(' ')[3]}`;
      });

      resolve(data_parsed);
    });
  }
}

export enum TipoReciboReporte {
  detallado = 'detallado',
  agrupado = 'agrupado',
}
