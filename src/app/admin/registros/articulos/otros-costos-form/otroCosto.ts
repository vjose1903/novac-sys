import { CrudG } from '../../../../core/typescript/crud-g';
import * as _ from 'lodash';
export interface OtroCostoI {
  [prop: string]: any;
}

export class OtrosCostosC extends CrudG<OtroCostoI> {
  constructor() {
    super('otros_costos');
  }
}
