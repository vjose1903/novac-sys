export interface exportExcelConfigI {
    fileName: (datos: string) => string,
    columns: Array<{title:string, key:string}>,
    fileNameDataKey: string
}
