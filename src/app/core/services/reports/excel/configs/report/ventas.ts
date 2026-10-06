import { multipleExportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { ReportTypeE } from '../../excel.interfaces';
import { makeFileName } from '../../utils';

export const csvConfig: multipleExportExcelConfigI = {
  detallado: {
    fileName: (datos: string, prefix: string = 'ventas') => makeFileName(datos, prefix),
    fileNameDataKey: 'titulo_reporte',
    type: ReportTypeE.normal,
    columns: [
      { title: 'Fecha', key: 'fecha_equivalente', formato_fecha: true },
      { title: 'Factura', key: 'numero_comprobante' },
      { title: 'Condición', key: 'condicion' },
      { title: 'Cliente', key: 'cliente_nombre', uppercase: true },
      { title: 'Total Venta', key: 'total_factura', bodyFormat: '#,##0.00' },
    ],
  },
  detallado_itbis: {
    fileName: (datos: string, prefix: string = 'ventas') => makeFileName(datos, prefix),
    fileNameDataKey: 'titulo_reporte',
    type: ReportTypeE.normal,
    columns: [
      { title: 'Fecha', key: 'fecha_equivalente', formato_fecha: true },
      { title: 'Factura', key: 'numero_comprobante' },
      { title: 'Condición', key: 'condicion' },
      { title: 'Cliente', key: 'cliente_nombre', uppercase: true },
      { title: 'Bruto', key: 'Bruto', bodyFormat: '#,##0.00' },
      { title: 'Itbis', key: 'itbis', bodyFormat: '#,##0.00' },
      { title: 'Total Venta', key: 'total_factura', bodyFormat: '#,##0.00' },
    ],
  },
  agrupado: {
    fileName: (datos: string, prefix: string = 'ventas') => makeFileName(datos, prefix),
    fileNameDataKey: 'titulo_reporte',
    type: ReportTypeE.normal,
    columns: [
      { title: 'Fecha', key: 'fecha' },
      { title: 'Ventas al contado', key: 'ventas_contado', bodyFormat: '#,##0.00' },
      { title: 'Ventas a crédito', key: 'ventas_credito', bodyFormat: '#,##0.00' },
      { title: 'Bruto', key: 'bruto_general', bodyFormat: '#,##0.00' },
      { title: 'Devuelto', key: 'devuelto_general', bodyFormat: '#,##0.00' },
      { title: 'Total Venta', key: 'total_general', bodyFormat: '#,##0.00' },
    ],
  },
  agrupado_itbis: {
    fileName: (datos: string, prefix: string = 'ventas') => makeFileName(datos, prefix),
    fileNameDataKey: 'titulo_reporte',
    type: ReportTypeE.normal, 
    columns: [
      { title: 'Fecha', key: 'fecha' },
      { title: 'Ventas al contado', key: 'ventas_contado', bodyFormat: '#,##0.00' },
      { title: 'Ventas a crédito', key: 'ventas_credito', bodyFormat: '#,##0.00' },
      { title: 'Bruto', key: 'bruto_general', bodyFormat: '#,##0.00' },
      { title: 'Itbis', key: 'itbis_general', bodyFormat: '#,##0.00' },
      { title: 'Devuelto', key: 'devuelto_general', bodyFormat: '#,##0.00' },
      { title: 'Total Venta', key: 'total_general', bodyFormat: '#,##0.00' },
    ],
  },
};
