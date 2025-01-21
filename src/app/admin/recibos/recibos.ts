import { fun } from '../../core/services/functions.service';
import { CrudG } from '../../core/typescript/crud-g';
import { ModalClass } from '../components/modal/modal-class';
import { DetalleFacturaComponent } from '../manipular facturas/detalle-factura/detalle-factura.component';
import { ReporteC } from '../reportes/reporte';
import * as _ from 'lodash';
import { csvConfig as csvConfigReciboIngreso } from '../../core/services/reports/excel/configs/report/recibo_ingreso';
import { ReportGroupTypeE } from '../reportes/reporte.utils';
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
        dinamico: [{ clase: 'btn btn-blanco', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false }],
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

    requestParameters['desde'] = fun.my_dateFormater(reporteParams.data.desde, false);
    requestParameters['hasta'] = fun.my_dateFormater(reporteParams.data.hasta, false);
    requestParameters['order'] = 'ASC';
    requestParameters['tipo'] = reporteParams.data.tipo;

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };

    console.log("reporteParams.data.tipo ", reporteParams.data.tipo);
    console.log("ReportGroupTypeE.detallado ", ReportGroupTypeE.detallado);
    
    ReporteC.configCsv = csvConfigReciboIngreso[reporteParams.data.tipo == ReportGroupTypeE.detallado ? 'detallado' : 'agrupado'];

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
      let objPdfView = { ...response, titulo: pdfParams.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: pdfParams.openNewModal };

      ReporteC.visualizarReporte(objPdfView);
    });
  }
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  parseDataToPdf(data) {
    return new Promise((resolve) => {
      const data_parsed = fun.remplaceKeyFromJson(data, [
        { old_key: 'numero_reporte', new_key: 'numero_documento' },
        { old_key: 'numero_recibo', new_key: 'identificador' },
        { old_key: 'detalle_recibos', new_key: 'contenido_reporte' },
      ]);

      data_parsed['tipo_pdf'] = 'RECIBO DE INGRESOS';
      data_parsed['numero_documento'] = data_parsed['identificador'];
      data_parsed['usuario'] = data.user.nombre_completo;

      const documento = _.find(data.cliente.documentos_de_identidad, { principal: true });
      data_parsed['cliente']['rnc'] = documento ? documento.documento : '----------';

      data_parsed['contenido_reporte'].map((detalle) => {
        detalle['tipo'] = _.split(detalle.descripcion, ' ')[0];
        detalle['comprobante_fiscal'] = _.split(detalle.descripcion, ' ')[1];
        detalle['fecha'] = `${_.split(detalle.descripcion, ' ')[2]} ${_.split(detalle.descripcion, ' ')[3]}`;
      });

      resolve(data_parsed);
    });
  }
}
