import { IAutoCompleteConfig } from '../../../core/components/form-fields/form-auto-complete/form-auto-complete.utils';
import { CrudG } from '../../../core/typescript/crud-g';
import { BancoI } from '../../registros/banco/banco.utils';
import { CuentaBancariaI } from '../../registros/banco/cuenta-bancaria-form/cuenta_bancaria';
import { DivisaI } from '../../registros/divisa/divisa.utils';
import { EmpleadoI } from '../../registros/registro-empleados/empleado.utils';

export class ChequeC extends CrudG<any> {
  constructor() {
    super('cheques');
  }
}

export const chequeTableId = 'lista_cheques';

export interface ChequeI {
  id?: number;
  tasa: number;
  monto: number | string;
  monto_local: number | string;
  balance?: number;
  comentario: string;
  fecha_equivalente: Date;
  fecha_update?: Date;
  fecha_anulacion?: Date;
  secuencia: number;
  estado: string;
  divisa: DivisaI;
  cuenta_bancaria: CuentaBancariaI;
  user_creador: EmpleadoI;
  last_user_update: EmpleadoI;
  user_anulador: EmpleadoI;
  banco_obj: BancoI;
  [nombrePropiedad: string]: any;
}

export const anularChequeModalId = 'modal_anular_cheque_id';

export enum chequeFormAttr {
  id = 'id',
  cuenta_bancaria_id = 'cuenta_bancaria_id',
  divisa_id = 'divisa_id',
  monto = 'monto',
  comentario = 'comentario',
  fecha_equivalente = 'fecha_equivalente',

}

export enum chequeFormFieldId {
  cuenta_bancaria_id = 'cuenta_bancaria_dropdown',
  divisa_id = 'divisa_dropdown',
  monto = 'monto_input',
  comentario = 'comentario_input',
  fecha_equivalente = 'fecha_equivalente_input',
  send = 'send',
}
