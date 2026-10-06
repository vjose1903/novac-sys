import { Injectable } from '@angular/core';
import { ConfigI } from '@core/interface/config-interface';
import { serie } from '@core/typescript/constantes';
import { actionFacturacion, FacturasI, tipoDocFacturacion } from '../factura';

@Injectable({
  providedIn: 'root',
})
export class FacturacionRefillStateService {
  readonly accionesQueRequierenBusqueda = [actionFacturacion.update, actionFacturacion.bill_from_cotizacion, actionFacturacion.bill_from_pre_venta, actionFacturacion.duplicate];
  readonly accionesContado = [actionFacturacion.bill_from_cotizacion, actionFacturacion.bill_from_pre_venta];
  readonly accionesConSerieDefault = [actionFacturacion.bill_from_cotizacion, actionFacturacion.bill_from_pre_venta, actionFacturacion.duplicate];

  shouldLookupDocument(action: actionFacturacion): boolean {
    return this.accionesQueRequierenBusqueda.includes(action);
  }

  shouldForceContado(action: actionFacturacion): boolean {
    return this.accionesContado.includes(action);
  }

  shouldUseInvoiceDate(action: actionFacturacion): boolean {
    return [actionFacturacion.update, actionFacturacion.bill_from_pre_venta].includes(action);
  }

  getSerieForRefill(params: { factura: FacturasI; action: actionFacturacion; configApp: ConfigI }): { currentSerie: serie; equivalentSerie: boolean } {
    const { factura, action, configApp } = params;
    if (configApp.usa_facturacion_electronica !== true) return { currentSerie: serie.normal, equivalentSerie: false };

    const tieneComprobanteElectronico = factura?.numero_comprobante?.includes('E');
    let currentSerie = tieneComprobanteElectronico ? serie.electronica : factura?.serie ?? serie.electronica;
    let equivalentSerie = false;

    if (this.accionesConSerieDefault.includes(action) && configApp.serie_default !== currentSerie) {
      currentSerie = configApp.serie_default;
      equivalentSerie = true;
    }

    return { currentSerie, equivalentSerie };
  }

  getModoFactura(params: { factura: FacturasI; action: actionFacturacion }): string {
    const { factura, action } = params;

    if (factura.tipo === tipoDocFacturacion.pre_venta) {
      return action === actionFacturacion.bill_from_pre_venta ? 'normal' : tipoDocFacturacion.cotizacion;
    }

    if (factura.tipo === tipoDocFacturacion.cotizacion) {
      return action === actionFacturacion.bill_from_cotizacion ? 'normal' : tipoDocFacturacion.cotizacion;
    }

    if (factura.is_viaje) return 'viaje';
    if (factura.is_adelantada) return 'adelantada';

    return 'normal';
  }

  prepareDetalles(detalles: any[], action: actionFacturacion): any[] {
    const detallesActivos = detalles.filter(detalle => !detalle.is_devuelto || (detalle.is_devuelto && detalle.is_defectuoso));

    if (action !== actionFacturacion.duplicate) return detallesActivos;

    return detallesActivos.map(detalle => {
      delete detalle.id;
      return detalle;
    });
  }
}
