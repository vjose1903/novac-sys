import { IAutoCompleteConfig } from './../../../core/components/form-auto-complete/form-auto-complete.utils';
import { CrudG } from '../../../core/typescript/crud-g';
import { CuentaBancariaI } from './cuenta-bancaria-form/cuenta_bancaria';

export class BancoC extends CrudG<any> {
  constructor() {
    super('bancos');
  }
}

export interface BancoI {
  id?: number;
  nombre?: ListBancoI | string;
  rnc?: string;
  comentario?: string;
  telefono?: string;
  direccion?: string;
  ejecutivo_cuenta?: string;
  telefono_ejecutivo_cuenta?: string;
  estado: boolean;
  cuentas_bancarias: Array<CuentaBancariaI>;
  [nombrePropiedad: string]: any;
}

export interface ListBancoI {
  id?: number;
  nombre?: string;
  identificador?: string;
}
export class ListaBancoC extends CrudG<any> {
  constructor() {
    super('nombre_bancos');
  }
}

export const nombreBancoConfig: IAutoCompleteConfig = {
  label: 'Nombre:',
  placeholder: 'Ingrese el nombre del banco',
  keyLabel: 'nombre',
  canCreateNewOptions: false,
  noOptionFoundMessage: 'El banco buscado no existe\nPor favor comunicarse con el soporte de Novac System. para agregarlo.',
};

export enum bancoFormAttr {
  id = 'id',
  nombre = 'nombre',
  rnc = 'rnc',
  comentario = 'comentario',
  telefono = 'telefono',
  direccion = 'direccion',
  ejecutivo_cuenta = 'ejecutivo_cuenta',
  telefono_ejecutivo_cuenta = 'telefono_ejecutivo_cuenta',
  estado = 'estado',
  cuentas_bancarias = 'cuentas_bancarias',
}

export enum bancoFormFieldId {
  id = 'id',
  rnc = 'rnc_input',
  comentario = 'comentario_textarea',
  telefono = 'telefono_input',
  direccion = 'direccion_input',
  ejecutivo_cuenta = 'ejecutivo_cuenta_input',
  telefono_ejecutivo_cuenta = 'telefono_ejecutivo_cuenta_input',
  estado = 'estado_input',
  cuentas_bancarias = 'cuentas_bancarias_input',
  send = 'send',
}
