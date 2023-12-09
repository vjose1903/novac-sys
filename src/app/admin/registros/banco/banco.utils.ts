import { CrudG } from '../../../core/typescript/crud-g';

export class BancoC extends CrudG<any> {
  constructor() {
    super('bancos');
  }
}

export interface BancoI {
  id?: number;
  nombre?: string;
  rnc?: string;
  comentario?: string;
  telefono?: string;
  direccion?: string;
  ejecutivo_cuenta?: string;
  telefono_ejecutivo_cuenta?: string;
  cuentas_bancarias: Array<any>;
}
// [nombrePropiedad: string]: any;
