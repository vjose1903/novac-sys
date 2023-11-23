import { CrudG } from '../../../core/typescript/crud-g';
import { PeriodoFiscalI } from '../../registros/periodo-fiscal/periodo-fiscal';
import { CuentaContableI } from '../catalogo-cuentas-page/catalogo-cuentas/cuentas-contables-form/cuentas_contables.utils';

export class AsientoContableC extends CrudG<any> {
  constructor() {
    super('cabezas_asientos_contables');
  }
}

export interface CabezaAsietoContableI {
  id: number;
  comentario: string;
  tipo: string;
  fecha_equivalente: string;
  fecha_anulacion: null;
  is_validated: boolean;
  estado: boolean;
  usuario_creador: UsuarioCreador;
  usuario_anulador: null;
  periodo_fiscal: PeriodoFiscalI;
  detalles_asientos_contables: Array<DetalleAsientoContableI>;
  [prop: string]: any;
}

export interface DetalleAsientoContableI {
  id: number;
  valor_credito: number | null;
  valor_debito: number | null;
  cuenta_contable_auxiliar: CuentaContableI;
  cuenta_contable_control: CuentaContableI;
  cuenta_contable_auxiliar_id: number;
  cuenta_contable_control_id: number;
}

interface UsuarioCreador {
  id: number;
  nombre_completo: string;
}
export enum tipoAsiento {
  automatico = 'automatico',
  manual = 'manual',
}
