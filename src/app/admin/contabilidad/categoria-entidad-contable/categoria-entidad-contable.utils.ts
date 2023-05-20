import { CuentaContableI } from './../catalogo-cuentas-page/catalogo-cuentas/cuentas-contables-form/cuentas_contables.utils';
import { CrudG } from './../../../core/typescript/crud-g';

export class CategoriaEntidadContableC extends CrudG<any> {
  constructor() {
    super('categorias_entidades_contables');
  }

  static entidad = {
    cliente: 'cliente' as entidadesContables,
    user: 'user' as entidadesContables,
    articulo: 'articulo' as entidadesContables,
    suplidor: 'suplidor' as entidadesContables,
    cuenta_bancaria: 'cuenta_bancaria' as entidadesContables,
  };
}

export type entidadesContables = 'cliente' | 'user' | 'articulo' | 'suplidor' | 'cuenta_bancaria';

export interface CategoriaEntidadContableI {
  id: number;
  descripcion: string;
  entidad: string;
  key: string;
  is_nacional: boolean;
  configuracion_id: number;
  cuenta_contable_control: CuentaContableI;
  cuenta_contable_auxiliar: CuentaContableI;
  [nombrePropiedad: string]: any;
}
