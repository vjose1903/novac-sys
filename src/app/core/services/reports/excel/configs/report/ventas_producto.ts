import { exportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { makeFileName } from '../../utils';
import { ReportTypeE } from '../../excel.interfaces';

export const csvConfig: exportExcelConfigI = {
  fileName: (datos: string, prefix: string = 'ventas_productos') => makeFileName(datos, prefix),
  fileNameDataKey: 'sub_titulo',
  type: ReportTypeE.groupTitleInColumn,
  titleRowInCols: { index: 0, title: 'Tipo' },
  columns: [
    { title: 'Articulo', key: 'nombre', uppercase: true },
    { title: 'Vendido', key: 'vendido_mostrar' },
    { title: 'Devuelto', key: 'devuelto_mostrar' },
    { title: 'Descuentos', key: 'total_descuento', bodyFormat: '#,##0.00' },
    { title: 'Total Vendido', key: 'total_general', bodyFormat: '#,##0.00' },
  ],
};
