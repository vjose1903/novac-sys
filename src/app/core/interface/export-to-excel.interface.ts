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
  prefix?: string;
  fileName: (datos: string, prefix?: string) => string;
  columns: Array<exportExcelColumnsI>;
  fileNameDataKey: string;
  indexToAddTitleRowInCols?: number;
}

export interface multipleExportExcelConfigI {
  [key: string]: exportExcelConfigI;
}
