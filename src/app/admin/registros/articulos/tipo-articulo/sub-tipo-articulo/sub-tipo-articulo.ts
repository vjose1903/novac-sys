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
}
