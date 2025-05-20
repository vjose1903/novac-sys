import { exportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { ReportTypeE } from '../../excel.interfaces';
import { makeFileName } from '../../utils';

export const csvConfig: exportExcelConfigI = {
  fileName: (datos: string, prefix: string = 'suplidor_producto') => makeFileName(datos, prefix),
  fileNameDataKey: 'sub_titulo',
  type: ReportTypeE.normal, 
  columns: [
    { title: 'Fecha', key: 'fecha_equivalente', formato_fecha: true },
    { title: 'Suplidor', key: 'suplidor_nombre', uppercase: true },
  ],
};
