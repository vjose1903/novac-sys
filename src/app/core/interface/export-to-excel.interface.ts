export interface exportExcelConfigI {
  fileName: (datos: string) => string;
  columns: Array<{ title: string; key: string; formato_fecha?: boolean; formato_numero?: boolean }>;
  fileNameDataKey: string;
}
