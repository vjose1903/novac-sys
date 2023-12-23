import { CrudG } from '../../../core/typescript/crud-g';
import { CuentaBancariaI } from './cuenta-bancaria-form/cuenta_bancaria';


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
  estado: boolean;
  cuentas_bancarias: Array<CuentaBancariaI>;
}

// [nombrePropiedad: string]: any;
