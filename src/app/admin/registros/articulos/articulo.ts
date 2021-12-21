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

  getArticulosFiltrado(params: { buscar: any; fecha: any }) {
    return new Promise<any>((resolve, reject) => {
      let extra = { afterPath: `filtro/${params.buscar}`, parameters: {} };

      extra['parameters'] = { page: 1, per_page: 20, paginado: true, is_compra: false, tipo: 'todos', fecha: params.fecha };

      this.getAll(extra).then((res) => resolve(res['data']));
    });
  }
}
