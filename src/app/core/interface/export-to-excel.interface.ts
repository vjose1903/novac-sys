import { ReportTypeE } from "../services/reports/excel/excel.interfaces";

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
  fileNameDataKey?: string;
  titleRowInCols?: exportExcelTitleRowInColsI;
  type: ReportTypeE;
}

export interface exportExcelSerializableConfigI {
  columns: Array<exportExcelColumnsI>;
}

export interface exportExcelTitleRowInColsI {
  index: number;
  title: string;
}

export interface multipleExportExcelConfigI {
  [key: string]: exportExcelConfigI;
}
