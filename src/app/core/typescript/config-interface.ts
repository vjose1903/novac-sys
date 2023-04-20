export interface ConfigI {
  cliente:                     string;
  nombre_empresa:              string;
  rnc_empresa:                 string;
  direccion_empresa:           string;
  telefono_empresa:            string;
  logo_empresa:                string;
  logo_impresion:              string;
  color_app:                   string;
  gitUser:                     string;
  url_servidor:                string;
  url_servidor_respaldo:       string;
  url_servidor_descargas:      string;
  config_password:             string;
  usa_url_principal:           boolean;
  is_produccion:               boolean;
  calcular_itbis:              boolean;
  se_calcula_saco:             boolean;
  pages_sizes:                 Documentos;
  printer_selected:            Documentos;
  plantillas_impresion:        PlantiallasImpresion;
  is_development:              boolean;
  printersList:                Printer[];
  app_version:                 string;
  is_db_local:                 boolean;
  facturacion_editar_precio:   boolean;
  vende_sin_inventario:        boolean;
  documentos_a_imprimir:       string;
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
