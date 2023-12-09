import { CrudG } from '../../../../core/typescript/crud-g';

export class CuentaBancariaC extends CrudG<any> {
  constructor() {
    super('cuentas_bancarias');
  }
}

export interface CuentaBancariaI {
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
export const modalCuentaBancaria = 'cuentaBancariaForm';
export const modalCuentaBancariaBtnAceptar = 'cuentaBancariaFormBtnAceptar';
