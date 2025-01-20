export interface exportExcelColumnsI {
  title: string;
  key: string;
  formato_fecha?: boolean;
  uppercase?: boolean;
  formato_numero?: boolean;
  bodyFormat?: string;
  nullIfCero?: boolean;
}

export interface exportExcelConfigI {
  fileName: (datos: string) => string;
  columns: Array<exportExcelColumnsI>;
  fileNameDataKey: string;
}

export interface multipleExportExcelConfigI {
  [key: string]: exportExcelConfigI;
}
