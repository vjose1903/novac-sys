import { CrudG } from '../../../../../core/typescript/crud-g';

export class CuentaContableC extends CrudG<any> {
  constructor() {
    super('cuentas_contables');
  }
}

export interface CuentaContableI {
  id: number;
  descripcion: string;
  cuenta_control: number | null;
  codigo: string;
  grupo_cuenta_id: number;
  nivel: number;
  origen: Origen;
  is_control: boolean;
  estado: boolean;
  tipo: Tipo;
  cuentas_contables?: CuentaContableI[];
  label?: string;
  [nombrePropiedad: string]: any;
}

export enum Origen {
  Crédito = 'Crédito',
  Débito = 'Débito',
}

export enum Tipo {
  Nominal = 'Nominal',
  Real = 'Real',
}
