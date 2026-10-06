import { CrudGSignal } from '@core/typescript/crud-g-signal';

export type CuadreEstado = 'submitted' | 'approved' | 'rejected' | 'reopened' | 'cancelled';
export type DenominationType = 'bill' | 'coin' | 'foreign_currency';
export type MovementGroup = 'other_payment_methods' | 'additional_transfers';

export interface CuadreDenominacion {
  denomination_type: DenominationType;
  divisa_id?: number;
  currency_code?: string;
  denomination_value: string;
  quantity: string;
  exchange_rate?: string;
  description?: string;
}

export interface CuadreDivisa {
  id: number;
  nombre: string;
  simbolo: string;
  code?: string;
  current_tasa?: string;
  tasa_cambio_id?: number;
  is_principal?: boolean;
  estado?: boolean;
  imagen?: any;
}

export interface CuadreMovimiento {
  movement_group: MovementGroup;
  payment_method: string;
  description: string;
  reference: string;
  amount: string;
  source?: string;
}

export interface CuadreSystemIncome {
  final_consumer_invoices_total: string;
  income_receipts_total: string;
  system_income_total: string;
  credit_invoices_total?: string;
  payment_methods?: Record<string, string>;
  invoice_payment_methods?: Record<string, string>;
  receipt_payment_methods?: Record<string, string>;
  invoices?: any[];
  credit_invoices?: any[];
  receipts?: any[];
}

export interface CuadrePrepareResponse {
  exists_cuadre: boolean;
  source: 'stored' | 'calculated';
  closing_date: string;
  closing_version?: 'detailed' | 'legacy' | string;
  flow_type?: 'new' | 'legacy' | string;
  is_new_flow?: boolean;
  cuadre?: any;
  divisa_principal?: CuadreDivisa;
  divisas?: CuadreDivisa[];
  system_income?: CuadreSystemIncome;
  denominations?: {
    bills?: CuadreDenominacion[];
    coins?: CuadreDenominacion[];
    foreign_currency?: CuadreDenominacion[];
  };
  movements?: {
    other_payment_methods?: CuadreMovimiento[];
    additional_transfers?: CuadreMovimiento[];
    suggested_from_system?: CuadreMovimiento[];
  };
  totals?: Record<string, string>;
}

export interface CuadreListItem {
  id: number;
  closing_date?: string;
  fecha?: string;
  status?: CuadreEstado;
  estado?: CuadreEstado;
  closing_version?: 'detailed' | 'legacy' | string;
  flow_type?: 'new' | 'legacy' | string;
  is_new_flow?: boolean;
  total?: string;
  operational_total?: string;
  system_income_total?: string;
  difference?: string;
}

export class CuadreCajaSignalC extends CrudGSignal<any> {
  constructor() {
    super('cuadre_cajas');
  }

  prepareRequest(closingDate: string) {
    return this.createRequest({ closing_date: closingDate }, { afterPath: 'prepare', requestParams: [{ key: 'spinner', value: 'no_show' }] });
  }

  customRequest(body: any) {
    return this.createRequest(body, { afterPath: 'custom' });
  }
}
