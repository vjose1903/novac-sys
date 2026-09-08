import { Injectable } from '@angular/core';
import { fun } from '@core/services/functions.service';
import moment from '../../../core/javascript/moment';
import { FacturasI } from '../factura';

@Injectable({
  providedIn: 'root',
})
export class FacturacionArchiveCompareService {
  isSameArchivedFactura(currentFactura: FacturasI, archivedFactura: FacturasI): boolean {
    return fun.isEqual(this.getComparableFactura(currentFactura), this.getComparableFactura(fun.deepCloning(archivedFactura)));
  }

  private getComparableFactura(data: FacturasI) {
    if (!data) return null;

    const normalizeDetails = (data.detalle_facturas || [])
      .map(detalle => ({
        articulo_id: this.normalizeNumber(detalle.articulo_id ?? (detalle.articulo as any)?.id),
        codigo: this.normalizeText(detalle.codigo),
        cantidad: this.normalizeNumber(detalle.cantidad),
        costo: this.normalizeNumber(detalle.costo),
        precio: this.normalizeNumber(detalle.precio),
        descuento_valor: this.normalizeNumber(detalle.descuento_valor),
        unidad: this.normalizeText(detalle.unidad)?.toLowerCase(),
        is_defectuoso: this.normalizeBoolean(detalle.is_defectuoso),
        is_devuelto: this.normalizeBoolean(detalle.is_devuelto),
        peso_saco: this.normalizeNumber(detalle.peso_saco),
        calcular_saco: this.normalizeBoolean(detalle.calcular_saco),
      }))
      .sort((a, b) => fun.compare(a, b, ['articulo_id', 'codigo', 'unidad', 'cantidad', 'precio'], 'asc'));

    const normalizeMovimientos = (data.is_viaje ? data.movimientos_viaje || [] : [])
      .map(movimiento => ({
        vehiculo_id: this.normalizeNumber(movimiento.vehiculo_id),
        user_id: this.normalizeNumber(movimiento.user_id),
      }))
      .sort((a, b) => fun.compare(a, b, ['vehiculo_id', 'user_id'], 'asc'));

    return {
      tipo: this.normalizeText(data.tipo),
      action: this.normalizeText(data.action),
      condicion: this.normalizeText(data.condicion),
      forma_pago: this.normalizeText(data.forma_pago),
      cliente_id: this.normalizeNumber(data.cliente_id),
      suplidor_id: this.normalizeNumber(data.suplidor_id),
      NoCliente_nombre: this.normalizeText(data.NoCliente_nombre),
      NoCliente_direccion: this.normalizeText(data.NoCliente_direccion),
      NoCliente_rnc: this.normalizeText(data.NoCliente_rnc),
      tipo_factura_id: this.normalizeNumber(data.tipo_factura_id),
      numero_comprobante: this.normalizeText(data.numero_comprobante),
      costoYgasto: this.normalizeText(data.costoYgasto),
      factura_pendiente: this.normalizeBoolean(data.factura_pendiente),
      is_adelantada: this.normalizeBoolean(data.is_adelantada),
      is_external: this.normalizeBoolean(data.is_external),
      is_viaje: this.normalizeBoolean(data.is_viaje),
      fecha_equivalente: data.factura_pendiente ? this.normalizeDate(data.fecha_equivalente) : null,
      fecha_vencimiento: this.normalizeDate(data.fecha_vencimiento),
      fecha_viaje: data.is_viaje ? this.normalizeDate(data.fecha_viaje) : null,
      movimientos_viaje: normalizeMovimientos,
      detalle_facturas: normalizeDetails,
    };
  }

  private normalizeText(value): string | null {
    return fun.isEmpty(value) ? null : String(value).trim();
  }

  private normalizeNumber(value) {
    if (fun.isEmpty(value)) return null;

    const numberValue = Number(fun.desformatearStNumber(value));
    return Number.isFinite(numberValue) ? Number(fun.roundNumberToDecimal(numberValue)) : value;
  }

  private normalizeDate(value) {
    if (fun.isEmpty(value)) return null;

    const date = moment(value);
    return date.isValid() ? date.format('YYYY-MM-DD') : value;
  }

  private normalizeBoolean(value): boolean {
    return value === true;
  }
}
