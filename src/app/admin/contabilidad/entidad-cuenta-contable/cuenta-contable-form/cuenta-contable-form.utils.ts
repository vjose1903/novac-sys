import { fun } from './../../../../core/services/functions.service';
import { entidadesContables } from './../../categoria-entidad-contable/categoria-entidad-contable.utils';
import { ConfiguracionEntidadCuentaI } from '../../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { CuentaContableI } from '../../catalogo-cuentas-page/catalogo-cuentas/cuentas-contables-form/cuentas_contables.utils';
import { SignalFormBuilder } from './../../../../core/services/signal-form/signal-form.builder';
import { SignalFormInstance } from './../../../../core/services/signal-form/signal-form.config';

// ========== TIPOS ==========

export type agrupacionContable = 'categoria' | 'individual' | 'sub_categoria' | 'sin_cuenta';

export const agrupacionesContables = {
  categoria: 'categoria' as agrupacionContable,
  individual: 'individual' as agrupacionContable,
  sub_categoria: 'sub_categoria' as agrupacionContable,
  sin_cuenta: 'sin_cuenta' as agrupacionContable,
};

export const tipoCategoria = {
  tipoArticulo: 'tipo_articulos',
  subTipoArticulo: 'sub_tipo_articulos',
};

// ========== INTERFACES ==========

export interface CuentaContableFormModel {
  id: number | null;
  tipo_agrupacion_contable: agrupacionContable | null;
  tipo_categoria: string | null;
  tipo_categoria_id: number | null;
  is_comun: boolean;
  has_cuenta: boolean;
  configuracion_entidad_cuenta_id: number | null;
}

export interface CuentaContableFormInputs {
  selectedConfig: ConfiguracionEntidadCuentaI;
  entidad: entidadesContables;
}

export interface CuentaContableFormConfig {
  btn?: { individual?: boolean; categoria?: boolean; subCategoria?: boolean };
}

export interface EntidadCuentaContableI {
  id: number;
  configuracion_entidad_cuenta_id: number;
  key: string;
  tipo_agrupacion_contable: agrupacionContable;
  is_comun: boolean;
  cuenta_contable: CuentaContableI;
  origen_categoria: OrigenCategoria;
  [nombrePropiedad: string]: any;
}

export interface OrigenCategoria {
  id: number;
  descripcion: string;
  table_name?: string;
}

export interface FormEntidadCuentaContableI {
  id?: number;
  tipo_categoria_id: number | null;
  tipo_categoria?: string | null;
  tipo_agrupacion_contable: agrupacionContable;
  has_cuenta: boolean;
  is_comun: boolean;
  configuracion_entidad_cuenta_id: number;
  cuenta_contable?: CuentaContableI;
  [nombrePropiedad: string]: any;
}

// ========== VALORES POR DEFECTO ==========

export const cuentaContableFormDefaults: CuentaContableFormModel = {
  id: null,
  tipo_agrupacion_contable: null,
  tipo_categoria: null,
  tipo_categoria_id: null,
  is_comun: false,
  has_cuenta: true,
  configuracion_entidad_cuenta_id: null,
};

// ========== BUILDER DEL FORMULARIO ==========

export function createCuentaContableForm(initialData?: Partial<CuentaContableFormModel>): SignalFormInstance<CuentaContableFormModel> {
  const defaults = { ...cuentaContableFormDefaults, ...initialData };

  return SignalFormBuilder.create<CuentaContableFormModel>()
    .addField('id', { defaultValue: defaults.id })
    .addField('tipo_agrupacion_contable', { defaultValue: defaults.tipo_agrupacion_contable })
    .addField('tipo_categoria', { defaultValue: defaults.tipo_categoria })
    .addField('tipo_categoria_id', { defaultValue: defaults.tipo_categoria_id })
    .addField('is_comun', { defaultValue: defaults.is_comun })
    .addField('has_cuenta', { defaultValue: defaults.has_cuenta })
    .addField('configuracion_entidad_cuenta_id', { defaultValue: defaults.configuracion_entidad_cuenta_id })
    .setValidateOnChange(false)
    .build();
}

// ========== FUNCIONES HELPER ==========

export function enableIsComunSwitch(params: { selectedConfig: ConfiguracionEntidadCuentaI; entidad: entidadesContables; isArticulo: boolean; formValue: CuentaContableFormModel }): boolean {
  if (params.isArticulo) return params.selectedConfig.has_comun;
  return fun.hasValue(params.formValue.tipo_categoria_id);
}

export function mapDataToFormModel(data: FormEntidadCuentaContableI | undefined, configId?: number): CuentaContableFormModel {
  return {
    id: data?.id ?? null,
    tipo_agrupacion_contable: data?.tipo_agrupacion_contable ?? null,
    tipo_categoria: data?.tipo_categoria ?? null,
    tipo_categoria_id: data?.tipo_categoria_id ?? null,
    is_comun: data?.is_comun ?? false,
    has_cuenta: data ? data.tipo_agrupacion_contable !== agrupacionesContables.sin_cuenta : true,
    configuracion_entidad_cuenta_id: data?.configuracion_entidad_cuenta_id ?? configId ?? null,
  };
}
