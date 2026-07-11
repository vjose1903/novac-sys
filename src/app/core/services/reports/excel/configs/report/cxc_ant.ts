import { multipleExportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { ReportTypeE } from '../../excel.interfaces';
import { makeFileName } from '../../utils';

export const csvConfig: multipleExportExcelConfigI = {
  detallado: {
    fileName: (datos: string, prefix: string = 'cxc_ant_saldo_detallado') => makeFileName(datos, prefix),
    fileNameDataKey: 'sub_titulo',
    type: ReportTypeE.normal, 
    columns: [
      { title: 'Cliente', key: 'cliente_nombre', uppercase: true },
      { title: 'Fecha', key: 'fecha_equivalente', formato_fecha: true },
      { title: '0 - 30 Dias', key: 'cero_to_treinta', nullIfCero: true, bodyFormat: '#,##0.00' },
      { title: '31 - 60 Dias', key: 'treinta_uno_to_sesenta', nullIfCero: true, bodyFormat: '#,##0.00' },
      { title: '61 - 90 Dias', key: 'sesenta_uno_to_noventa', nullIfCero: true, bodyFormat: '#,##0.00' },
      { title: 'mas 91 Dias', key: 'noventa_uno_to_more', nullIfCero: true, bodyFormat: '#,##0.00' },
      { title: 'Facturado', key: 'total_factura', bodyFormat: '#,##0.00' },
      { title: 'Pendiente', key: 'total_pendiente', bodyFormat: '#,##0.00' },
    ],
  },
  agrupado: {
    fileName: (datos: string, prefix: string = 'cxc_ant_saldo_agrupado') => makeFileName(datos, prefix),
    fileNameDataKey: 'sub_titulo',
    type: ReportTypeE.normal, 
    columns: [
      { title: 'Cliente', key: 'cliente_nombre', uppercase: true },
      { title: '0 - 30 Dias', key: 'cero_to_treinta', nullIfCero: true, bodyFormat: '#,##0.00' },
      { title: '31 - 60 Dias', key: 'treinta_uno_to_sesenta', nullIfCero: true, bodyFormat: '#,##0.00' },
      { title: '61 - 90 Dias', key: 'sesenta_uno_to_noventa', nullIfCero: true, bodyFormat: '#,##0.00' },
      { title: 'mas 91 Dias', key: 'noventa_uno_to_more', nullIfCero: true, bodyFormat: '#,##0.00' },
      { title: 'Facturado', key: 'total_factura', bodyFormat: '#,##0.00' },
      { title: 'Pendiente', key: 'total_pendiente', bodyFormat: '#,##0.00' },
    ],
  },
};

const columnasAntiguedadKeys = ['cero_to_treinta', 'treinta_uno_to_sesenta', 'sesenta_uno_to_noventa', 'noventa_uno_to_more'];

export function filterCxcAntCsvConfig(config, columnasAntiguedad?: string[]) {
  if (!Array.isArray(columnasAntiguedad) || columnasAntiguedad.length === 0) return config;

  const allowedColumns = new Set(columnasAntiguedad);

  return {
    ...config,
    columns: config.columns.filter(column => !columnasAntiguedadKeys.includes(column.key) || allowedColumns.has(column.key)),
  };
}
