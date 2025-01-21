import { exportExcelConfigI } from '../../../../../interface/export-to-excel.interface';
import { ReportTypeE } from '../../excel.interfaces';
import { makeFileName } from '../../utils';

export const csvConfig: exportExcelConfigI = {
  fileName: (datos: string, prefix: string = 'viajes_camion') => makeFileName(datos, prefix),
  type: ReportTypeE.normal, 
  columns: [
    { title: 'Fecha creada', key: 'fecha_equivalente', formato_fecha: true },
    { title: 'Fecha viaje', key: 'fecha_viaje', formato_fecha: true },
    { title: 'Comprobante', key: 'numero_comprobante' },
    { title: 'Chofer', key: 'chofer', uppercase: true },
    { title: 'Flete', key: 'flete', bodyFormat: '#,##0.00' },
  ],
};
