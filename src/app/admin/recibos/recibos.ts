import { fun } from '../../core/services/functions.service';
import { CrudG } from '../../core/typescript/crud-g';
import { ModalClass } from '../components/modal/modal-class';
import { DetalleFacturaComponent } from '../manipular facturas/detalle-factura/detalle-factura.component';
import { ReporteC } from '../reportes/reporte';
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
  camiones_viajes?: any;
  choferes_viajes?: any;
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
      width: '30rem',
      height: '10rem',
      botones: {
        ...ModalClass.noShowAceptarCancelarButtons,
        dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false }],
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

  static requestReporte(reporteParams, pdfParams) {
    let requestParameters;

    requestParameters = { desde: fun.my_dateFormater(reporteParams.data.desde, false), hasta: fun.my_dateFormater(reporteParams.data.hasta, false), tipo_recibo: reporteParams.data.tipo, order: 'ASC' };

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
      let objPdfView = { ...response, titulo: pdfParams.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: pdfParams.openNewModal };

      ReporteC.visualizarReporte(objPdfView);
    });
  }
}
