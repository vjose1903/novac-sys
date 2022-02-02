import { CrudG } from '../../../../core/typescript/crud-g';
import * as _ from 'lodash';

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
