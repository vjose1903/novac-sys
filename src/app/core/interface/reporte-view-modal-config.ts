import { viewerOptions } from '../components/pdf-viewer/pdf-viewer';

export interface ReporteViewModalConfigI {
  status: string;
  pageOrientation: string;
  file: any;
  base64: any;
  reimprimir: any;
  msg: any;
  titulo: string;
  viewerOptions: viewerOptions;
  requestResult?: ReporteBackendResponseI;
  [key: string]: any;
}

export interface ReporteBackendResponseI {
  titulo_reporte: string;
  tipo_reporte: string;
  fecha: string;
  realizado_por: string;
  itbis: number;
  bruto: number;
  descuento: number;
  devuelto: number;
  total: number;
  facturado: number;
  mostrar_sub_titulo: boolean;
  sub_titulo: string;
  tipo_tabla: string;
  contenido_reporte: Array<any>;
}
