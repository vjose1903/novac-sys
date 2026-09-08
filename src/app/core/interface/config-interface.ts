import { operativeSystemE, serie } from "../typescript/constantes";
import type { ThemeColor, ThemeMode } from '../typescript/theme.types';

export interface EmpresaI {
  id: string;
  key: string;
  nombre: string;
}

export interface ConfigI {
  id?:                         string | number;
  cliente:                     string;
  nombre_empresa:              string;
  rnc_empresa:                 string;
  direccion_empresa:           string;
  telefono_empresa:            string;
  logo_empresa:                string;
  logo_impresion:              string;
  color_app:                   ThemeColor;
  mode_app:                    ThemeMode;
  machineId?:                  string;
  operative_system?:           operativeSystemE;
  url_servidor:                string;
  url_servidor_respaldo:       string;
  config_password:             string;
  usa_url_principal:           boolean;
  usa_facturas_externas:       boolean;
  is_produccion:               boolean;
  has_contabilidad:            boolean;
  calcular_itbis:              boolean;
  pages_sizes:                 Documentos;
  printer_selected:            Documentos;
  printersList?:               Printer[] | string [];
  app_version?:                string;
  is_db_local:                 boolean;
  facturacion_editar_precio:   boolean;
  vende_sin_inventario:        boolean;
  use_ecf?:                    boolean;
  documentos_a_imprimir:       string;
  serie_default:               serie;
  medida_producto_terminado:   string;
}

export interface Documentos {
  venta_contado:   string;
  venta_credito:   string;
  pre_venta:       string;
  compra:          string;
  recibo_ingreso:  string;
  conduce:         string;
  nota:            string;
  cuadre_caja:     string;
  reporte:         string;
  cotizacion:      string;
}
export interface PlantiallasImpresion {
  nota:            string;
}

export interface Printer {
  name:            string;
  displayName:     string;
  description:     string;
  status:          number;
  isDefault:       boolean;
  options:         { [key: string]: string };
}
