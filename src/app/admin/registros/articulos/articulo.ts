import { CrudG } from '@core/typescript/crud-g';
import { ReporteC } from '../../reportes/reporte';
import { fun } from '@core/services/functions.service';
import { csvConfig as ventas_producto_csvConfig } from '@core/services/reports/excel/configs/report/ventas_producto';
import { ReportDateTypeE } from '../../reportes/reporte.utils';
import { ICallbackModal, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';

export enum tipos_articulos {
  veterinaria = 'veterinaria',
  materia_prima = 'materia_prima',
  producto_terminado = 'producto_terminado',
  otro = 'otro',
  materiales_de_oficina = 'materiales_de_oficina',
  servicios_legales = 'servicios_legales',
  servicios_contables = 'servicios_contables',
  dulces = 'dulces',
}

export class TipoArticuloC extends CrudG<any> {
  constructor() {
    super('tipo_articulos');
  }
}

export interface ArticuloI {
  data?: any;
  id?: number;
  imagen_id?: null;
  tipo_articulo_id?: number;
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
  [prop: string]: any;
}

export type ArticuloFiltroMode = 'select' | 'list' | 'usable' | 'formula' | 'full';
export type ArticuloFiltroMatch = 'exact' | 'search';

export class ArticuloC extends CrudG<ArticuloI> {
  constructor() {
    super('articulos');
  }

  getArticulosFiltrado(arg: { buscar: any; fecha: any; parameters?: any; tipo?: any; page?: number; per_page?: number; paginado?: boolean; is_compra?: boolean; mode?: ArticuloFiltroMode; match?: ArticuloFiltroMatch; limit?: number }) {
    return new Promise<any>((resolve, reject) => {
      const { buscar, fecha, parameters, tipo = 'todos', page = 1, per_page = 20, paginado = true, is_compra = false, mode, match, limit } = arg;
      let extra = { afterPath: `filtro/${buscar}`, parameters: {} };

      extra['parameters'] = {
        page: page,
        per_page: per_page,
        paginado: paginado,
        is_compra: is_compra,
        tipo: tipo,
        fecha: fecha,
        mode: mode,
        match: match,
        limit: limit,
        ...parameters,
      };

      this.getAll(extra)
        .then(res => resolve(res))
        .catch(err => reject(err));
    });
  }

  static openModalReporteForm(params: { tipo: any; titulo?: any }) {
    return new Promise<any>((resolve, reject) => {
      const { tipo, titulo } = params;
      const inputs = { tipo_reporte: tipo };

      let objModal;
      switch (params.tipo) {
        case 'ventas_productos':
          ReporteC.objReporte = { inputs: inputs, id: tipo, header: titulo, callback: returnDataFromModal };
          objModal = ReporteC.objReporte;

          break;

        default:
          break;
      }

      function returnDataFromModal(arg: ICallbackModal) {
        if (arg.type != modalCloseType.returnData) return;
        ArticuloC.requestReporte(arg.data, params);
        resolve(arg.data);
      }

      new DynamicModalClass(ReporteC.objReporte).show();
    });
  }

  static requestReporte(reporteParams, pdfParams) {
    const formReporte = reporteParams.data;

    let requestParameters;

    switch (pdfParams.tipo) {
      case 'ventas_productos':
        if (formReporte.tipo == ReportDateTypeE.one_day) requestParameters = { desde: fun.my_dateFormater(formReporte.fecha, false) };
        else requestParameters = { desde: fun.my_dateFormater(formReporte.desde, false), hasta: fun.my_dateFormater(formReporte.hasta, false) };

        ReporteC.configCsv = ventas_producto_csvConfig;
        break;

      default:
        break;
    }

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then(response => {
        let objPdfView = { ...response, titulo: pdfParams.titulo, fileName: fun.first(fun.split(response.file, '.')) };

      ReporteC.visualizarReporte(objPdfView);
    });
  }
}
