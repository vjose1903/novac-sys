export interface ConfigI {
  nombre_empresa:            string;
  rnc_empresa:               string;
  direccion_empresa:         string;
  telefono_empresa:          string;
  logo_empresa:              string;
  logo_impresion:            string;
  color_app:                 string;
  gitUser:                   string;
  url_servidor:              string;
  url_servidor_respaldo:     string;
  url_servidor_descargas:    string;
  config_password:           string;
  usa_url_principal:         boolean;
  printer_caja_selected:     Printer;
  printer_reportes_selected: Printer;
  pages_sizes:               PagesSizes;
  is_development:            boolean;
  printersList:              Printer[];
  app_version:               string;
}

export interface PagesSizes {
  conduce:         string;
  cuadre_caja:     string;
  facturacion:     string;
  recibo_ingreso:  string;
  reporte:         string;
}

export interface Printer {
  name:            string;
  displayName:     string;
  description:     string;
  status:          number;
  isDefault:       boolean;
  options:         { [key: string]: string };
}
