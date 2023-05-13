import { CuentaContableI } from '../catalogo-cuentas-page/catalogo-cuentas/cuentas-contables-form/cuentas_contables.utils';
import { CrudG } from '../../../core/typescript/crud-g';

export class ConfiguracionEntidadCuentaC extends CrudG<any> {
  constructor() {
    super('configuraciones_entidades_cuentas');
  }
}

export interface ConfiguracionEntidadCuentaI {
  id: number;
  descripcion: string;
  entidad: string;
  key: string;
  is_nacional: boolean;
  cuenta_contable: CuentaContableI;
  [nombrePropiedad: string]: any;
}
