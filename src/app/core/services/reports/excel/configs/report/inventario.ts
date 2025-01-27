import { exportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { ReportTypeE } from '../../excel.interfaces';
import { makeFileName } from '../../utils';

export const csvConfig: exportExcelConfigI = {
  fileName: (datos: string, prefix: string = 'inventario') => makeFileName(datos, prefix),
  fileNameDataKey: 'sub_titulo',
  type: ReportTypeE.normal, 
  columns: [
    { title: 'Código', key: 'codigo' },
    { title: 'Articulo', key: 'nombre', uppercase: true },
    { title: 'Cantidad', key: 'cantidad_principal' },
    { title: 'Precio', key: 'precio_principal', bodyFormat: '#,##0.00' },
  ],
};
