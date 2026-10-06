import { FacturasI } from "@admin/facturacion/factura";

export interface inputViewerOptions {
  viewerOptions: viewerOptions;
  show_estado?: boolean;
  estado_documento?: string;
  factura?: FacturasI;
  [key: string]: any;
}

export interface viewerOptions {
  filenameForDownload?: string;
  base64Src?: string;
  height?: string;
  width?: string;
  showDownloadButton?: boolean;
  showOpenFileButton?: boolean;
  showSecondaryToolbarButton?: boolean;
  showZoomButtons?: boolean;
  showRotateButton?: boolean;
  enablePrint?: boolean;
  textLayer?: boolean;
}
