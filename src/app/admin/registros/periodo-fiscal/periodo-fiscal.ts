import { CrudG } from '../../../core/typescript/crud-g';

export class PeriodoFiscalC extends CrudG<any> {
  constructor() {
    super('periodos_fiscales');
  }


}

export interface PeriodoFiscalI {
  id: number;
  fecha_inicio: string;
  fecha_cierre: string;
  estado: boolean;
  is_open: boolean;
  detalle_periodo_fiscal: DetallePeriodoFiscal;
  [nombrePropiedad: string]: any;
}

export interface DetallePeriodoFiscal {
  id: number;
  enero: boolean;
  febrero: boolean;
  marzo: boolean;
  abril: boolean;
  mayo: boolean;
  junio: boolean;
  julio: boolean;
  agosto: boolean;
  septiembre: boolean;
  octubre: boolean;
  noviembre: boolean;
  diciembre: boolean;
}
