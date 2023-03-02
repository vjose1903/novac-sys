export interface inputViewerOptions {
  viewerOptions: viewerOptions;
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
  useBrowserLocale?: boolean;
  textLayer?: boolean;
}
