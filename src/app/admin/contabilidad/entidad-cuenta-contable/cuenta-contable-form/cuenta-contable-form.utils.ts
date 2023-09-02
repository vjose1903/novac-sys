import { fun } from './../../../../core/services/functions.service';
import { entidadesContables } from './../../categoria-entidad-contable/categoria-entidad-contable.utils';
import { ConfiguracionEntidadCuentaI } from '../../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';

export type agrupacionContable = 'categoria' | 'individual' | 'sub_categoria' | 'sin_cuenta';

export const agrupacionesContables = {
  categoria: 'categoria' as agrupacionContable,
  individual: 'individual' as agrupacionContable,
  sub_categoria: 'sub_categoria' as agrupacionContable,
  sin_cuenta: 'sin_cuenta' as agrupacionContable,
};

export const tipoCategoria = {
  tipoArticulo: 'tipo_articulo',
  subTipoArticulo: 'sub_tipo_articulo',
};
export interface EntidadCuentaContableI {
  id: number;
  configuracion_entidad_cuenta_id: number;
  key: string;
  tipo_agrupacion_contable: agrupacionContable;
  is_comun: boolean;
  cuenta_contable: CuentaContable;
  origen_categoria: OrigenCategoria;
  [nombrePropiedad: string]: any;
}

export interface CuentaContable {
  id: number;
  descripcion: string;
  codigo: string;
  label: string;
}

export interface OrigenCategoria {
  id: number;
  descripcion: string;
}

export interface FormEntidadCuentaContableI {
  id?: number;
  tipo_categoria_id: number | null;
  tipo_categoria?: string | null;
  tipo_agrupacion_contable: agrupacionContable;
  has_cuenta: boolean;
  is_comun: boolean;
  configuracion_entidad_cuenta_id: number;
  cuenta_contable?: CuentaContable;
  [nombrePropiedad: string]: any;
}

export const entidadCuentaContableBlank: FormEntidadCuentaContableI = {
  id: null,
  tipo_categoria_id: null,
  tipo_categoria: null,
  tipo_agrupacion_contable: null,
  has_cuenta: true,
  is_comun: false,
  configuracion_entidad_cuenta_id: null,
};

export function enableIsComunSwitch(params: { selectedConfig: ConfiguracionEntidadCuentaI; entidad: entidadesContables; isArticulo: boolean; formValue: any }) {
  let res = true;

  if (params.isArticulo) {
    res = params.selectedConfig.has_comun;
  } else {
    res = fun.hasValue(params.formValue.tipo_categoria_id);
  }


  return res;
}
