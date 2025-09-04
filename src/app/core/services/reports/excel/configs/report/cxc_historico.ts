import { exportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { ReportTypeE } from '../../excel.interfaces';
import { makeFileName } from '../../utils';

export const csvConfig: exportExcelConfigI = {
  fileName: (datos: string, prefix: string = 'cxc') => makeFileName(datos, prefix),
  fileNameDataKey: 'sub_titulo',
  type: ReportTypeE.normal, 
  columns: [
    { title: 'Fecha', key: 'fecha_equivalente', formato_fecha: true },
    { title: 'Factura', key: 'numero_documento' },
    { title: 'Facturado', key: 'total_factura', bodyFormat: '#,##0.00' },
    { title: 'Pagado', key: 'total_pagado', bodyFormat: '#,##0.00' },
    { title: 'Pendiente', key: 'balance_pendiente', bodyFormat: '#,##0.00' },
  ]
};
