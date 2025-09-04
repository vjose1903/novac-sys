import { CrudG } from '@core/typescript/crud-g';

export class GrupoCuentaC extends CrudG<any> {
  constructor() {
    super('grupos_de_cuentas');
  }
}
