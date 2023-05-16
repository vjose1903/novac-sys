import { CrudG } from './../../../../core/typescript/crud-g';

export class TasaDeCambioC extends CrudG<any> {
  constructor() {
    super('tasas_de_cambio');
  }
}


export interface TasaDeCambioI {
  id:                number;
  divisa_id:         number;
  valor:             number;
  fecha_equivalente: string;
  [nombrePropiedad: string]: any;
}
