import { Injectable } from '@angular/core';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from '../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { EntidadCuentaContableI, FormEntidadCuentaContableI, agrupacionesContables } from './cuenta-contable-form/cuenta-contable-form.utils';
import { fun } from '../../../core/services/functions.service';

@Injectable({
  providedIn: 'root',
})
export class EntidadCuentaContableService {
  configEntContableClass = new ConfiguracionEntidadCuentaC();

  constructor() {}

  validateEntidades(params: { configsEntCuentas: ConfiguracionEntidadCuentaI[]; entidad_cuentas_contables: FormEntidadCuentaContableI[] }) {
    return new Promise<{ error: boolean; msg: string }>((resolve, reject) => {
      let result = { error: false, msg: '' };

      if (params.configsEntCuentas.length == params.entidad_cuentas_contables.length) {
        for (let index = 0; index < params.entidad_cuentas_contables.length; index++) {
          const cuenta_contable = params.entidad_cuentas_contables[index];
          const current_config = params.configsEntCuentas.find((config) => config.id == cuenta_contable.configuracion_entidad_cuenta_id) as ConfiguracionEntidadCuentaI;

          if (cuenta_contable.tipo_agrupacion_contable != agrupacionesContables.individual && fun.isEmpty(cuenta_contable.tipo_categoria_id)) {
            result.error = true;
            result.msg = `En la cuenta contable para: ${this.configEntContableClass.getConfigLabel(current_config)}, seleccionaste que tiene una agrupación por ${cuenta_contable.tipo_agrupacion_contable}, pero no seleccionaste la agrupación.`;
          }
        }
      } else {
        result.error = true;
        result.msg = `Debe de agregar todas las cuentas pertenecientes para la entidad: ${this.configEntContableClass.getConfigLabel(params.configsEntCuentas[0])}`;
      }

      resolve(result);
    });
  }

  parseCuentasFromBackend(cuentas_cuentables: EntidadCuentaContableI[]): FormEntidadCuentaContableI[] {
    return cuentas_cuentables.map((cuenta: EntidadCuentaContableI) => {
      const values_pick = ['id', 'configuracion_entidad_cuenta_id', 'tipo_agrupacion_contable', 'is_comun'];

      const cuentaParsed: FormEntidadCuentaContableI = fun.pick(fun.duplicarJson(cuenta), values_pick);

      cuentaParsed.tipo_categoria_id = cuenta?.origen_categoria?.id || null;
      cuentaParsed.tipo_categoria = null; //TODO: ver como hacer esta parte para articulos.

      return cuentaParsed;
    });
  }
}
