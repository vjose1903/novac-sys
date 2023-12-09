import { CrudG } from '../../../../core/typescript/crud-g';

export class TipoCuentaBancariaC extends CrudG<any> {
  constructor() {
    super('tipo_cuentas_bancarias');
  }
}

export interface TipoCuentaBancariaI {
  id?: number;
  descripcion?: string;
  [nombrePropiedad: string]: any;
}
export const modalTipoCuentaBancaria = 'tipoCuentaBancariaForm';
export const tableTipoCuentaBancaria = 'listado_tipo_cuentas_contables';
