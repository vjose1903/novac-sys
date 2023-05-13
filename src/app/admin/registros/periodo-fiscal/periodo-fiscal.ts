import { CrudG } from '../../../core/typescript/crud-g';

export class PeriodoFiscalC extends CrudG<any> {
  constructor() {
    super('periodos_fiscales');
  }

  // # Numbers
  static numbers = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
  };

  // # Labels
  static labels = {
    _1_: 'enero',
    _2_: 'febrero',
    _3_: 'marzo',
    _4_: 'abril',
    _5_: 'mayo',
    _6_: 'junio',
    _7_: 'julio',
    _8_: 'agosto',
    _9_: 'septiembre',
    _10_: 'octubre',
    _11_: 'noviembre',
    _12_: 'diciembre',
  };
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
