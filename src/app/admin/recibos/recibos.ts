import { CrudG } from '../../core/typescript/crud-g';

export interface ReciboI {
  id?: number;
  user_id?: number;
  tipo_factura_id?: number;
  cliente_id?: number;
  vehiculo_id?: null;
  total?: number;
  chofer?: null;
  forma_pago?: string;
  numero_recibo?: number;
  incidencia?: null;
  devuelta?: number;
  fecha_equivalente?: string;
  estado?: boolean;
  cliente?: any;
  user?: any;
  detalle_recibos?: any;

  total_registros?: any;
  data?: any;
}

export class ReciboC extends CrudG<ReciboI> {
  constructor() {
    super('recibos_ingresos');
  }
}
