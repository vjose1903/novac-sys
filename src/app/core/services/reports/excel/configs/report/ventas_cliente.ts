import { exportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { ReportTypeE } from '../../excel.interfaces';
import { makeFileName } from '../../utils';

export const csvConfig: exportExcelConfigI = {
  fileName: (datos: string, prefix: string = 'ventas_cliente') => makeFileName(datos, prefix),
  fileNameDataKey: 'sub_titulo',
  type: ReportTypeE.normal, 
  columns: [
    { title: 'Fecha', key: 'fecha_equivalente', formato_fecha: true },
    { title: 'Factura', key: 'numero_comprobante' },
    { title: 'Condición', key: 'condicion' },
    { title: 'Cliente', key: 'cliente_nombre', uppercase: true },
    { title: 'Total Venta', key: 'total_factura', bodyFormat: '#,##0.00' },
  ],
};
