import { CrudG } from '@core/typescript/crud-g';

export interface ConfigArticuloI {
  id?: number;
  porciento_ganancia?: number;
}

export class ConfigArticuloC extends CrudG<any> {
  constructor() {
    super('config_articulos');
  }

  getWinPercerntCalc(configArticulo: ConfigArticuloI) {
    return (100 - configArticulo.porciento_ganancia) / 100;
  }
}
