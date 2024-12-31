import { IAutoCompleteConfig } from '../../../core/components/form-fields/form-auto-complete/form-auto-complete.utils';
import { CrudG } from '../../../core/typescript/crud-g';
import { BancoI } from '../../registros/banco/banco.utils';
import { CuentaBancariaI } from '../../registros/banco/cuenta-bancaria-form/cuenta_bancaria';
import { DivisaI } from '../../registros/divisa/divisa.utils';
import { EmpleadoI } from '../../registros/registro-empleados/empleado.utils';

export class TransferenciaC extends CrudG<any> {
  constructor() {
    super('transferencias');
  }
}

export enum TransferenciaType {
  terceros = 'terceros',
  misCuentas = 'mis_cuentas',
}

export const nombreBancoTerceroConfig: IAutoCompleteConfig = {
  label: 'Nombre Banco',
  placeholder: 'Ingrese el nombre del banco',
  keyLabel: 'nombre',
  keyValue: 'nombre',
  canCreateNewOptions: false,
  noOptionFoundMessage: 'El banco buscado no existe\nPor favor comunicarse con el soporte de Novac System. para agregarlo.',
};

export const transferenciasType = [
  { label: 'Terceros', value: TransferenciaType.terceros, disabled: false },
  { label: 'Entre mis Cuentas', value: TransferenciaType.misCuentas, disabled: false },
];

export const transferenciaTableId = 'lista_tansferencias';

export interface TransferenciaI {
  id?: number;
  tasa: number;
  monto?: number | string;
  monto_local: number;
  comentario: string;
  numero_referencia: string;
  fecha_equivalente: string | Date;
  fecha_anulacion?: null;
  nombre_banco_tercero?: null;
  cuenta_bancaria_tercero?: null;
  estado: true;
  cuenta_bancaria_origen: CuentaBancariaI;
  cuenta_bancaria_destino: CuentaBancariaI;
  divisa: DivisaI;
  user_creador: EmpleadoI;
  last_user_update?: EmpleadoI;
  user_anulador?: EmpleadoI;
  banco_obj: BancoI;
  destino_info_completa: string;
  cuenta_bancaria_origen_id: number;
  divisa_id: number;
  [nombrePropiedad: string]: any;
}

export const anularTransferenciaModalId = 'modal_anular_id';

export enum transferenciaFormAttr {
  id = 'id',
  cuenta_bancaria_origen_id = 'cuenta_bancaria_origen_id',
  cuenta_bancaria_destino_id = 'cuenta_bancaria_destino_id',
  nombre_banco_tercero = 'nombre_banco_tercero',
  cuenta_bancaria_tercero = 'cuenta_bancaria_tercero',
  divisa_id = 'divisa_id',
  monto = 'monto',
  comentario = 'comentario',
  numero_referencia = 'numero_referencia',
  fecha_equivalente = 'fecha_equivalente',
}

export enum transferenciaFormFieldId {
  cuenta_bancaria_origen_id = 'cuenta_bancaria_origen_dropdown',
  cuenta_bancaria_destino_id = 'cuenta_bancaria_destino_dropdown',
  cuenta_bancaria_tercero = 'cuenta_bancaria_tercero_input',
  divisa_id = 'divisa_dropdown',
  monto = 'monto_input',
  comentario = 'comentario_input',
  numero_referencia = 'numero_referencia_input',
  fecha_equivalente = 'fecha_equivalente_input',
  send = 'send',
}
