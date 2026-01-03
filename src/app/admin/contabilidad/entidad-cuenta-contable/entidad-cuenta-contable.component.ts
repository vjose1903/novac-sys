import { fun } from './../../../core/services/functions.service';
import { ConfiguracionEntidadCuentaI } from './../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { Component, computed, effect, input, model, signal } from '@angular/core';
import { entidadesContables } from '../categoria-entidad-contable/categoria-entidad-contable.utils';
import { EntidadCuentaContableI, FormEntidadCuentaContableI, cuentaContableFormDefaults } from './cuenta-contable-form/cuenta-contable-form.utils';
import { TipoArticuloI } from '../../registros/articulos/tipo-articulo/tipo-articulo';
import { SubTipoArticuloI } from '../../registros/articulos/tipo-articulo/sub-tipo-articulo/sub-tipo-articulo';

export interface EntidadCuentaContableInputs {
  configsEntCuentas: Array<ConfiguracionEntidadCuentaI>;
  entidad: entidadesContables;
}

export interface EntidadCuentaContableConfig {
  btn?: { individual?: boolean; categoria?: boolean; subCategoria?: boolean };
}

@Component({
  selector: 'entidad-cuenta-contable',
  templateUrl: './entidad-cuenta-contable.component.html',
  styleUrls: ['./entidad-cuenta-contable.component.scss'],
  standalone: false,
})
export class EntidadCuentaContableComponent {
  // Inputs como signals
  inputs = input.required<EntidadCuentaContableInputs>();
  configuration = input<EntidadCuentaContableConfig>({});
  camposDisabled = input<boolean>(false);
  infoTipoArticulo = input<{ categoria?: TipoArticuloI; sub_categoria?: SubTipoArticuloI }>();
  cuentasContablesDataCruda = input<EntidadCuentaContableI[]>([]);

  // Model para two-way binding
  cuentasContablesData = model<FormEntidadCuentaContableI[]>([]);

  // Estado interno
  activeIndex = 0;

  // Configuración procesada
  processedConfig = computed(() => {
    const config = this.configuration();
    return {
      btn: {
        individual: config?.btn?.individual ?? true,
        categoria: config?.btn?.categoria ?? true,
        subCategoria: config?.btn?.subCategoria ?? true,
      },
    };
  });

  // Computed para las cuentas inicializadas
  initializedCuentas = computed(() => {
    const configs = this.inputs().configsEntCuentas;
    const datosCrudos = this.cuentasContablesDataCruda();
    const datosActuales = this.cuentasContablesData();

    // Si hay datos crudos, usar los datos actuales (ya parseados)
    if (fun.hasValue(datosCrudos)) {
      return datosActuales.filter(cuenta => configs.some(c => c.id === cuenta.configuracion_entidad_cuenta_id));
    }

    // Si no hay datos crudos, crear blanks para las configuraciones que faltan
    const cuentasResultado: FormEntidadCuentaContableI[] = [];

    for (const config of configs) {
      let cuenta = datosActuales.find(c => c.configuracion_entidad_cuenta_id === config.id);

      if (!cuenta) {
        cuenta = fun.deepCloning(cuentaContableFormDefaults);
        cuenta.configuracion_entidad_cuenta_id = config.id;
        if (!config.has_comun) cuenta.is_comun = true;
      }

      cuentasResultado.push(cuenta);
    }

    return cuentasResultado;
  });

  // Flag para saber si está inicializado
  isInitialized = signal(false);

  constructor() {
    // Effect para sincronizar las cuentas inicializadas con el model
    effect(() => {
      const cuentas = this.initializedCuentas();
      const datosActuales = this.cuentasContablesData();

      // Solo actualizar si hay diferencias
      if (!fun.isEqual(cuentas, datosActuales)) {
        this.cuentasContablesData.set(cuentas);
        this.isInitialized.set(true);
      } else if (!this.isInitialized()) {
        this.isInitialized.set(true);
      }
    });
  }

  // Obtener datos de una cuenta específica
  getCuentaCruda(configId: number): EntidadCuentaContableI | undefined {
    return this.cuentasContablesDataCruda()?.find(cuenta => cuenta.configuracion_entidad_cuenta_id === configId);
  }

  getCuentaForm(configId: number): FormEntidadCuentaContableI | undefined {
    return this.cuentasContablesData()?.find(cuenta => cuenta.configuracion_entidad_cuenta_id === configId);
  }

  // Actualizar una cuenta específica
  updateCuenta(cuentaActualizada: FormEntidadCuentaContableI) {
    const cuentas = this.cuentasContablesData();
    const index = cuentas.findIndex(c => c.configuracion_entidad_cuenta_id === cuentaActualizada.configuracion_entidad_cuenta_id);

    if (index !== -1) {
      const nuevasCuentas = [...cuentas];
      nuevasCuentas[index] = { ...cuentaActualizada };
      this.cuentasContablesData.set(nuevasCuentas);
    }
  }
}
