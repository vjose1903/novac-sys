export type agrupacionContable = 'categoria' | 'individual' | 'sub_categoria';

export const agrupacionesContables = {
  categoria: 'categoria' as agrupacionContable,
  individual: 'individual' as agrupacionContable,
  sub_categoria: 'sub_categoria' as agrupacionContable,
};

export interface EntidadCuentaContableI {
  id: number;
  configuracion_entidad_cuenta_id: number;
  key: string;
  tipo_agrupacion_contable: string;
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
  tipo_agrupacion_contable: string;
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
  is_comun: false,
  configuracion_entidad_cuenta_id: null,
};
