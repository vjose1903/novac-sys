import { CrudG } from '../../../../core/typescript/crud-g';
import { CuentaContableI } from '../../../contabilidad/catalogo-cuentas-page/catalogo-cuentas/cuentas-contables-form/cuentas_contables.utils';
export class CuentaBancariaC extends CrudG<any> {
  constructor() {
    super('cuentas_bancarias');
  }
}

export interface CuentaBancariaI {
  id?: number;
  banco_id: number;
  tipo_cuenta_bancaria_id: number;
  divisa_id: number;
  numero_cuenta: string;
  comentario: string;
  descripcion: string;
  fecha_primera_conciliacion: string;
  fecha_apertura: string;
  estado: boolean;
  balance_inicial_libro: number;
  balance_inicial_banco: number;
  cuenta_contable: CuentaContableI;
  cuenta_contable_prima: CuentaContableI;
  tipo_cuenta_bancaria: string;
  [nombrePropiedad: string]: any;
}
export const modalCuentaBancaria = 'cuentaBancariaForm';
export const modalCuentaBancariaBtnAceptar = 'cuentaBancariaFormBtnAceptar';
