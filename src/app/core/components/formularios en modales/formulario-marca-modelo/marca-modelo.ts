import { CrudG } from '@core/typescript/crud-g';

export class MarcaC extends CrudG<any> {
  constructor() {
    super('marcas');
  }
}

export class ModeloC extends CrudG<any> {
  constructor() {
    super('modelos');
  }
}
