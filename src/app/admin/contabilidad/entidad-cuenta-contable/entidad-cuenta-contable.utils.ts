import { entidadesContables } from './../categoria-entidad-contable/categoria-entidad-contable.utils';
import { ConfiguracionEntidadCuentaI } from './../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';

export interface entidadCuentaContableInputsI {
  configsEntCuentas: Array<ConfiguracionEntidadCuentaI>;
  entidad: entidadesContables;
}


