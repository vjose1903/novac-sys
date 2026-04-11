import { CrudG } from '@core/typescript/crud-g';

export interface ReciboConfiguracionI {
  id?: number;
  card_percentage?: number;
}

export interface ReciboConfiguracionFormI {
  id: number;
  card_percentage: number;
}

export class ReciboConfiguracionC extends CrudG<any> {
  static readonly CURRENT_ID = 1;

  constructor() {
    super('recibo_configurations');
  }

  getCurrent() {
    return this.getOne(ReciboConfiguracionC.CURRENT_ID);
  }

  updateCurrent(data: ReciboConfiguracionFormI) {
    return this.updateOne({ ...data, id: ReciboConfiguracionC.CURRENT_ID });
  }
}
