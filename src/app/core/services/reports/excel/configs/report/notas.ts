import { exportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { ReportTypeE } from '../../excel.interfaces';
import { makeFileName } from '../../utils';

export const csvConfig: exportExcelConfigI = {
  fileName: (datos: string, prefix: string = 'notas_aplicadas') => makeFileName(datos, prefix),
  fileNameDataKey: 'sub_titulo',
  type: ReportTypeE.normal,
  columns: [
    { title: 'Fecha', key: 'fecha', formato_fecha: true },
    { title: 'Tipo nota', key: 'tipo_nota', uppercase: true },
    { title: 'Comprobante', key: 'numero_comprobante' },
    { title: 'Factura', key: 'factura'},
    { title: 'Monto', key: 'monto', bodyFormat: '#,##0.00' },
  ],
};
