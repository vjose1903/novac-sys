import { ToastService } from './../../../../../core/services/toast.service';
import { fun } from './../../../../../core/services/functions.service';
import { CrudG } from './../../../../../core/typescript/crud-g';
import { TipoArticuloI } from '../tipo-articulo';

export interface SubTipoArticuloI {
  id: number;
  descripcion: string;
  tipo_articulo: TipoArticuloI;
  cuentas_contables: SubTipoArticuloCuentasContable[];
  [propName: string]: any;
}

export interface SubTipoArticuloCuentasContable {
  id: number;
  key: string;
  descripcion_control: string;
  codigo_control: string;
  is_control_control: boolean;
  descripcion_auxiliar: string;
  codigo_auxiliar: string;
  is_control_auxiliar: boolean;
}

export interface TipoArticuloCuentasContable {
  id: number;
  key: string;
  descripcion_control?: string;
  codigo_control?: string;
  is_control_control?: boolean;
  descripcion_auxiliar: string;
  codigo_auxiliar: string;
  is_control_auxiliar: boolean;
  [propName: string]: any;
}

export class SubTipoArticuloC extends CrudG<SubTipoArticuloI> {
  constructor() {
    super('sub_tipo_articulos');
  }

  getSubTipoArticulos(params?: { per_page?: number; page?: number; search?: string; tipo_articulo_id?: Number; paginado: boolean; showMsgs?: boolean }) {
    return new Promise<any>((resolve, reject) => {
      params.paginado = fun.hasValue(params.paginado) ? params.paginado : false;
      params.showMsgs = fun.hasValue(params.showMsgs) ? params.showMsgs : true;
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const extra = { parameters: { page: params.page, per_page: params.per_page, paginado: true, filter_target: palabra_a_buscar, tipo_articulo_id: params.tipo_articulo_id } };

      if (!params.showMsgs) extra['requestParams'] = [ToastService.noShowMsgs];

      this.getAll(extra)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }
}
