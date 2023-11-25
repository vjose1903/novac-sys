import { CrudG } from '../../../core/typescript/crud-g';

export class BancoC extends CrudG<any> {
  constructor() {
    super('bancos');
  }
}

export interface BancoI {
  id?: number;
  [nombrePropiedad: string]: any;
}
