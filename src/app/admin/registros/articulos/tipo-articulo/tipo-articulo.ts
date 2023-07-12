import { CrudG } from './../../../../core/typescript/crud-g';

export enum tipos_articulos {
  veterinaria = 'veterinaria',
  materia_prima = 'materia_prima',
  producto_terminado = 'producto_terminado',
  otro = 'otro',
  materiales_de_oficina = 'materiales_de_oficina',
  servicios_legales = 'servicios_legales',
  servicios_contables = 'servicios_contables',
  dulces = 'dulces',
}

export interface TipoArticuloI {
  id: number;
  descripcion: string;
  tipo: string;
  codigo: string;
  cuentas_contables: TipoArticuloCuentasContable[];
  [propName: string]: any;
}

export interface TipoArticuloCuentasContable {
  id: number;
  key: string;
  descripcion_control?: string;
  codigo_control?: string;
  is_control_control?: boolean;
  descripcion_auxiliar: string;
  codigo_auxiliar: string;
  is_control_auxiliar: boolean;
  [propName: string]: any;
}

export class TipoArticuloC extends CrudG<TipoArticuloI> {
  constructor() {
    super('tipo_articulos');
  }

  static tipos = [
    { label: 'Venta normal', key: 'venta_normal' },
    { label: 'Servicio', key: 'servicio' },
  ];
}
