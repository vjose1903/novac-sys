import { exportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { makeFileName } from '../../utils';

export const csvConfig: exportExcelConfigI = {
  fileName: (datos: string) => makeFileName(datos, 'cuentas_con_pagos'),
  fileNameDataKey: 'sub_titulo',
  columns: [
    { title: 'Fecha', key: 'fecha_equivalente', formato_fecha: true },
    { title: 'Factura', key: 'numero_comprobante' },
    { title: 'Condición', key: 'condicion' },
    { title: 'Cliente', key: 'cliente_nombre' },
    { title: 'Facturado', key: 'total_factura', formato_numero: true },
    { title: 'Pendiente', key: 'total_pendiente', formato_numero: true },
  ]
};
