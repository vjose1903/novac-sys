export type agrupacionContable = 'categoria' | 'individual' | 'sub_categoria';

export const agrupacionesContables = {
  categoria: 'categoria' as agrupacionContable,
  individual: 'individual' as agrupacionContable,
  sub_categoria: 'sub_categoria' as agrupacionContable,
};

export interface EntidadCuentaContableI {
  id?: number;
  tipo_categoria_id: number;
  tipo_categoria?: string;
  tipo_agrupacion_contable: string;
  is_comun: boolean;
  configuracion_entidad_cuenta_id: number;
  [nombrePropiedad: string]: any;
}

export const entidadCuentaContableBlank = {
  id: null,
  tipo_categoria_id: null,
  tipo_categoria: null,
  tipo_agrupacion_contable: 'individual',
  is_comun: false,
  configuracion_entidad_cuenta_id: null,
};
