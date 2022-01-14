import { CrudG } from '../../core/typescript/crud-g';

export class FacturaC extends CrudG<any> {
  constructor() {
    super('cabecera_facturas');
  }

  getFacturaById(id: number) {
    return new Promise((resolve) => {
      this.getOne(id).then((res) => resolve(res));
    });
  }
}
