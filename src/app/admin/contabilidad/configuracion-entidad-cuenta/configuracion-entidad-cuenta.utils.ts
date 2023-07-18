import { CuentaContableI } from '../catalogo-cuentas-page/catalogo-cuentas/cuentas-contables-form/cuentas_contables.utils';
import { CrudG } from '../../../core/typescript/crud-g';

export class ConfiguracionEntidadCuentaC extends CrudG<any> {
  constructor() {
    super('configuraciones_entidades_cuentas');
  }

  getConfigLabel(config: ConfiguracionEntidadCuentaI) {
    let label = this.configsKeyLabel[config.key];
    if (!config.is_nacional) label = `${label} EXTRANJERO`;
    return label;
  }

  configsKeyLabel = {
    cobrar: 'Cuentas por cobrar',
    pagar: 'Cuentas por pagar',
    retencion: 'Retención',
    efectivo_banco: 'Efectivo en banco',
    inventario: 'Inventario',
    ventas: 'Ventas',
    descuento_ventas: 'Descuento sobre ventas',
    compras: 'Compras',
    descuento_compras: 'Descuento sobre compras',
  };
}

export type Configkeys = 'cobrar' | 'pagar' | 'retencion' | 'efectivo_banco' | 'inventario' | 'ventas' | 'descuento_ventas' | 'compras' | 'descuento_compras';
export interface ConfiguracionEntidadCuentaI {
  id: number;
  descripcion: string;
  entidad: string;
  key: string;
  is_nacional: boolean;
  has_individual: boolean;
  has_comun: boolean;
  cuenta_contable: CuentaContableI;
  [nombrePropiedad: string]: any;
}
