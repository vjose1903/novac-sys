import { CrudG } from '@core/typescript/crud-g';

export class EmpleadoC extends CrudG<any> {
  constructor() {
    super('users');
  }
}
