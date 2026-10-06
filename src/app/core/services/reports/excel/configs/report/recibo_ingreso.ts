import { multipleExportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { ReportTypeE } from '../../excel.interfaces';
import { makeFileName } from '../../utils';

export const csvConfig: multipleExportExcelConfigI = {
  detallado: {
    fileName: (datos: string, prefix: string = 'recibo_ingreso_detallado') => makeFileName(datos, prefix),
    fileNameDataKey: 'sub_titulo',
    type: ReportTypeE.normal,
    columns: [
      { title: 'Fecha', key: 'fecha_equivalente', formato_fecha: true },
      { title: 'Cliente', key: 'cliente_nombre', uppercase: true },
      { title: 'Met. pago', key: 'forma_pago' },
      { title: 'Recibido', key: 'total', bodyFormat: '#,##0.00' },
    ],
  },
  agrupado: {
    fileName: (datos: string, prefix: string = 'recibo_ingreso_agrupado') => makeFileName(datos, prefix),
    fileNameDataKey: 'sub_titulo',
    type: ReportTypeE.normal,
    columns: [
      { title: 'Fecha', key: 'fecha' },
      { title: 'Recibido', key: 'total_general', bodyFormat: '#,##0.00' },
    ],
  },
};
