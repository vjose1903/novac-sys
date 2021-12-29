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
  stock?: any;
}

export class ArticuloC extends CrudG<ArticuloI> {
  constructor() {
    super('articulos');
  }

  getArticulosFiltrado(arg: { buscar: any; fecha: any; parameters?: any; tipo?: any; page?: number; per_page?: number; paginado?: boolean; is_compra?: boolean }) {
    return new Promise<any>((resolve, reject) => {
      let extra = { afterPath: `filtro/${arg.buscar}`, parameters: {} };

      extra['parameters'] = {
        page: arg.page || 1,
        per_page: arg.per_page || 20,
        paginado: arg.paginado || true,
        is_compra: false,
        tipo: arg.tipo || 'todos',
        fecha: arg.fecha,
        ...arg.parameters,
      };

      this.getAll(extra).then((res) => resolve(res));
    });
  }
}

export class TipoArticuloC extends CrudG<any> {
  constructor() {
    super('tipo_articulos');
  }
}
