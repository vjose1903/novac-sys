import { CrudG } from '../../../core/typescript/crud-g';

export class AsientoContableC extends CrudG<any> {
  constructor() {
    super('cabezas_asientos_contables');
  }
}

export enum tipoAsiento {
  automatico = 'automatico',
  manual = 'manual',
}
