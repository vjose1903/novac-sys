import { CrudG } from '@core/typescript/crud-g';

export class MovimientosC extends CrudG<any> {
  constructor() {
    super('movimientos_inventarios');
  }
}
