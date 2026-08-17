import { CrudG } from '@core/typescript/crud-g';

export interface ConfigCuadreValues {
  target_fondo?: number;
}

export interface ConfigCuadreI {
  id?: number;
  config?: ConfigCuadreValues;
}

export class ConfigCuadresC extends CrudG<any> {
  constructor() {
    super('configuracion_cuadres');
  }
}
