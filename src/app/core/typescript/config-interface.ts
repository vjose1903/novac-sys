export type modeAppT = 'dark' | 'light';
export type colorAppT = 'red' | 'blue' |'green';
export interface ConfigI {
  cliente:                     string;
  nombre_empresa:              string;
  rnc_empresa:                 string;
  direccion_empresa:           string;
  telefono_empresa:            string;
  logo_empresa:                string;
  logo_impresion:              string;
  color_app:                   colorAppT;
  mode_app:                    modeAppT;
  gitUser?:                    string;
  url_servidor:                string;
  url_servidor_respaldo:       string;
  url_servidor_descargas:      string;
  config_password:             string;
  usa_url_principal:           boolean;
  has_contabilidad:            boolean;
  is_produccion:               boolean;
  calcular_itbis:              boolean;
  pages_sizes:                 Documentos;
  printer_selected:            Documentos;
  plantillas_impresion:        PlantiallasImpresion;
  is_development?:             boolean;
  printersList?:               Printer[] | string [];
  app_version?:                string;
  is_db_local:                 boolean;
  facturacion_editar_precio:   boolean;
  vende_sin_inventario:        boolean;
  can_pagar:                   boolean;
  facturacion_electronica?:    boolean;
  documentos_a_imprimir:       string;
  medida_producto_terminado:   string;
}

export interface Documentos {
  venta_contado:               string;
  venta_credito:               string;
  pre_venta:                   string;
  compra:                      string;
  recibo_ingreso:              string;
  conduce:                     string;
  nota:                        string;
  cuadre_caja:                 string;
  reporte:                     string;
  cotizacion:                  string;
  pago_factura:                string;
}
export interface PlantiallasImpresion {
  nota:                        string;
}

export interface Printer {
  name:                        string;
  displayName:                 string;
  description:                 string;
  status:                      number;
  isDefault:                   boolean;
  options:                     { [key: string]: string };
}
