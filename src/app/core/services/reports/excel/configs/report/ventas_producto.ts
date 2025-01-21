import { exportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { makeFileName } from '../../utils';

export const csvConfig: exportExcelConfigI = {
  fileName: (datos: string, prefix: string = 'ventas_productos') => makeFileName(datos, prefix),
  fileNameDataKey: 'sub_titulo',
  indexToAddTitleRowInCols: 0,
  columns: [
    { title: 'Articulo', key: 'nombre', formato_fecha: true, uppercase: true },
    { title: 'Vendido', key: 'vendido_mostrar' },
    { title: 'Devuelto', key: 'devuelto_mostrar' },
    { title: 'Descuentos', key: 'descuento_valor', bodyFormat: '#,##0.00' },
    { title: 'Total Vendido', key: 'total', bodyFormat: '#,##0.00' },
  ],
};
