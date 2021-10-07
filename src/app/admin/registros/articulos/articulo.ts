import { CrudG } from '../../../core/typescript/crud-g';

export interface ArticuloI {
  data?: any;
  id?: number;
  imagen_id?: null;
  tipo_articulo_id?: number;
  nombre?: string;
  costo_principal?: number;
  precio_principal?: number;
  existencia?: number;
  aviso_existencia?: number;
  codigo?: string;
  fecha_ingreso?: Date;
  medida?: string;
  is_detallable?: boolean;
  medida_alerta?: string;
  calcular_itbis?: boolean;
  estado?: boolean;
  is_combo?: boolean;
  otros_costos?: number;
  vendido_en?: string;
  is_materia_prima?: boolean;
  contenido_articulos?: any[];
  formulas_productos_terminados?: any[];
  descripcion?: string;
  contenido?: any;
  cantidades?: any;
  calcular_saco?: boolean;
  costos?: any;
}

export class ArticuloC extends CrudG<ArticuloI> {
  constructor() {
    super('articulos');
  }
}
