import { CrudG } from '../../../core/typescript/crud-g';

export class DepositoC extends CrudG<any> {
  constructor() {
    super('depositos');
  }
}
export const depositoTableId = 'lista_depositos';
export interface DepositoI {
  id: number;
  [nombrePropiedad: string]: any;
}

export const anularDepositoModalId = 'modal_anular_id'
export enum depositoFormAttr {
  id = 'id',
  cuenta_bancaria_id = 'cuenta_bancaria_id',
  divisa_id = 'divisa_id',
  monto = 'monto',
  comentario = 'comentario',
  numero_referencia = 'numero_referencia',
  fecha_equivalente = 'fecha_equivalente',
}

export enum depositoFormFieldId {
  cuenta_bancaria_id = 'cuenta_bancaria_dropdown',
  divisa_id = 'divisa_dropdown',
  monto = 'monto_input',
  comentario = 'comentario_input',
  numero_referencia = 'numero_referencia_input',
  fecha_equivalente = 'fecha_equivalente_input',
  send = 'send',
}
