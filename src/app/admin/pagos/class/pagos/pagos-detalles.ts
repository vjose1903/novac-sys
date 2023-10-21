export interface PagoDetalleI {
  id?: number;
  cabecera_factura_id?: number;
  balance_anterior_factura?: number;
  balance_factura?: number;
  deposito?: number;
  is_ultimo?: boolean;
  descripcion?: string;
  pago_a_tiempo?: boolean;
}

export class PagoDetalleC {
  constructor() {}
}
