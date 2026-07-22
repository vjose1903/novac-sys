import { Injectable } from '@angular/core';
import { fun } from '@core/services/functions.service';

@Injectable({
  providedIn: 'root',
})
export class FacturacionCuerpoStateService {
  applyRetiradoState(detalles: any[], isAdelantada: boolean): void {
    const valorRetirado = isAdelantada ? 0 : undefined;

    detalles.forEach(detalle => {
      detalle.retirado = valorRetirado ?? detalle.cantidad_en_unidades;
      detalle.retirado_en_venta = valorRetirado ?? detalle.cantidad_en_unidades;
    });
  }

  prepareVentaDetalles(detalles: any[], params: { calcularItbis: boolean; isAdelantada: boolean }): void {
    detalles.forEach(detalle => {
      detalle.itbis = params.calcularItbis ? fun.desformatearStNumber(detalle.itbis) : 0;
    });

    this.applyRetiradoState(detalles, params.isAdelantada);
  }
}
