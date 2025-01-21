import { exportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { makeFileName } from '../../utils';

export const csvConfig: exportExcelConfigI = {
  fileName: (datos: string, prefix: string = 'cuentas_con_pagos') => makeFileName(datos, prefix),
  fileNameDataKey: 'sub_titulo',
  columns: [
    { title: 'Fecha', key: 'fecha_equivalente', formato_fecha: true },
    { title: 'Factura', key: 'numero_comprobante' },
    { title: 'Condición', key: 'condicion' },
    { title: 'Cliente', key: 'cliente_nombre', uppercase: true },
    { title: 'Total Venta', key: 'total_factura', bodyFormat: '#,##0.00' },
  ],
};
