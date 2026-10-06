import { Injectable } from '@angular/core';
import { teclasCode } from '@core/typescript/constantes';
import { tipoDocFacturacion } from '../factura';

export interface FacturacionExtraOption {
  keyboardCode: number;
  key: number;
  code: tipoDocFacturacion | 'retornar_devueltos';
  label: string;
  condition: () => boolean;
}

@Injectable({
  providedIn: 'root',
})
export class FacturacionExtraOptionsService {
  buildOptions(params: { hasPermisoPreVenta: boolean; hasPermisoCotizacion: boolean; hasDevueltos: () => boolean }): FacturacionExtraOption[] {
    const configOptions = [
      { code: tipoDocFacturacion.pre_venta, label: 'Seleccionar Pre-Venta', show: () => params.hasPermisoPreVenta, condition: () => true },
      { code: tipoDocFacturacion.cotizacion, label: 'Seleccionar Cotización', show: () => params.hasPermisoCotizacion, condition: () => true },
      { code: 'retornar_devueltos' as const, label: 'Retornar articulos devueltos', show: params.hasDevueltos, condition: params.hasDevueltos },
    ];

    return configOptions.filter(option => option.show()).map((option, index) => {
      const key = index + 1;

      return {
        ...option,
        key,
        keyboardCode: teclasCode[`_${key}`],
      };
    });
  }
}
