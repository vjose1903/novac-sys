import { CrudG } from '../../../core/typescript/crud-g';
import * as _ from 'lodash';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '../../../core/services/functions.service';
import { SubTipoArticuloI } from './tipo-articulo/sub-tipo-articulo/sub-tipo-articulo';
import { DateUtils } from '../../../core/typescript/date.utils';

export interface ArticuloI {
  data?: any;
  id?: number;
  imagen_id?: null;
  tipo_articulo_id?: number;
  sub_tipo_articulo_id?: number;
  sub_tipo_articulo?: SubTipoArticuloI;
  nombre?: string;
  costo_principal?: number;
  precio_principal?: number;
  existencia?: number;
  aviso_existencia?: number;
  codigo?: string;
  fecha_ingreso?: Date;
  medida?: string;
  is_detallable?: boolean;
  medida_alerta?: string;
  calcular_itbis?: boolean;
  estado?: boolean;
  is_combo?: boolean;
  otros_costos?: number;
  vendido_en?: string;
  is_materia_prima?: boolean;
  contenido_articulos?: any[];
  formulas_productos_terminados?: any[];
  descripcion?: string;
  contenido?: any;
  cantidades?: any;
  calcular_saco?: boolean;
  costos?: any;
  stock?: any;
  [nombrePropiedad: string]: any;
}

export class ArticuloC extends CrudG<ArticuloI> {
  constructor() {
    super('articulos');
  }

  getArticulosFiltrado(arg: { buscar: any; fecha: any; parameters?: any; tipo?: any; page?: number; per_page?: number; paginado?: boolean; is_compra?: boolean }) {
    console.log('arg:  ', arg)
    return new Promise<any>((resolve, reject) => {
      let extra = { afterPath: `filtro/${arg.buscar}`, parameters: {} };

      extra['parameters'] = {
        page: arg.page || 1,
        per_page: arg.per_page || 20,
        paginado: fun.objHas(arg, 'paginado') ? arg.paginado : true,
        is_compra: fun.objHas(arg, 'is_compra') ? arg.is_compra : false,
        tipo: arg.tipo || 'todos',
        fecha: arg.fecha,
        ...arg.parameters,
      };

      this.getAll(extra)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal }) {
    return new Promise<any>((resolve, reject) => {
      let objModal;
      switch (params.tipo) {
        case 'ventas_productos':
          ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo, returnDataFromModal: returnDataFromModal };
          objModal = ReporteC.objReporte;

          break;

        default:
          break;
      }

      params.openNewModal(objModal);

      function returnDataFromModal(arg) {
        ArticuloC.requestReporte(arg, params);
        resolve(arg);
      }
    });
  }

  static requestReporte(reporteParams, pdfParams) {
    let requestParameters;

    switch (pdfParams.tipo) {
      case 'ventas_productos':
        if (reporteParams.data.tipo == '1') requestParameters = { desde: DateUtils.format({ date: reporteParams.data.fecha, dateFormat: 'YYYY-MM-DD' }) };
        else requestParameters = { desde: DateUtils.format({ date: reporteParams.data.desde, dateFormat: 'YYYY-MM-DD' }), hasta: DateUtils.format({ date: reporteParams.data.hasta, dateFormat: 'YYYY-MM-DD' }) };

        break;

      default:
        break;
    }

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
      let objPdfView = { ...response, titulo: pdfParams.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: pdfParams.openNewModal };

      ReporteC.visualizarReporte(objPdfView);
    });
  }
}
