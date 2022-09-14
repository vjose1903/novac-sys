import { CrudG } from '../../../core/typescript/crud-g';

export class ClienteC extends CrudG<any> {
  constructor() {
    super('clientes');
  }
}
