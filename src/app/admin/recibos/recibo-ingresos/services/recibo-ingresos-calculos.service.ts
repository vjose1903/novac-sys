import { Injectable } from '@angular/core';
import { FacturasI } from '@admin/facturacion/factura';
import { fun } from '@core/services/functions.service';
import Big from 'big.js';
import moment from '../../../../core/javascript/moment';

@Injectable({
  providedIn: 'root',
})
export class ReciboIngresosCalculosService {
  parseMonto(value: any): number {
    const monto = fun.desformatearStNumber(value);
    return isNaN(monto) ? 0 : monto;
  }

  getMontoTotalFactura(balance: any, mora: any): string {
    return fun.roundNumberToDecimal(Big(this.parseMonto(balance)).plus(this.parseMonto(mora)).toNumber());
  }

  isInvalidMonto(value: any): boolean {
    const monto = fun.desformatearStNumber(value);
    return isNaN(monto) || fun.isEmpty(monto);
  }

  formarDetalleRecibos(facturasSelected: FacturasI[], tipo_recibo: string) {
    return facturasSelected.reduce(
      (acc, fact) => {
        const detalle = this.getDetalleReciboFromFactura(fact, tipo_recibo);

        acc.detalle.push(detalle);
        acc.bruto += detalle.deposito;
        acc.mora += detalle.mora;
        acc.total_recibo += this.parseMonto(fact.monto);

        return acc;
      },
      { bruto: 0, mora: 0, total_recibo: 0, detalle: [] as any[] }
    );
  }

  getDetalleReciboFromFactura(fact: FacturasI, tipo_recibo: string) {
    const monto = Big(this.parseMonto(fact.monto));
    const mora = this.parseMonto(fact.mora);
    const mora_received = Math.min(monto.toNumber(), mora);
    const deposito = Math.max(0, monto.minus(mora_received).toNumber());

    return {
      cabecera_factura_id: fact.id,
      pago_total: fact.pagoT,
      deposito,
      mora: mora_received,
      descripcion: tipo_recibo === 'Pago factura' ? this.getDescripcionDetalle(fact) : '',
      pago_a_tiempo: fact.pago_a_tiempo,
    };
  }

  getDescripcionDetalle(fact: FacturasI) {
    return `${fact.pagoT ? 'Saldo' : 'Abono'} ${fact.numero_comprobante} ${moment(fact.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')}`;
  }

  getReciboPayload(params: { cliente_id: number; detalleYtotal: any; forma_pago: any; devuelta: any; balance_cliente: number }) {
    return {
      cliente_id: params.cliente_id,
      bruto: params.detalleYtotal.bruto,
      mora: params.detalleYtotal.mora,
      total: params.detalleYtotal.total_recibo,
      forma_pago: params.forma_pago,
      tipo_factura_id: 17,
      devuelta: params.devuelta,
      numero_recibo: null,
      estado: true,
      detalle_recibos: params.detalleYtotal.detalle,
      balance_cliente: params.balance_cliente,
    };
  }

  hasSelectedSinMonto(facturasSelected: FacturasI[]): boolean {
    return facturasSelected.some(factura => factura.select && this.parseMonto(factura.monto) <= 0);
  }

  hasMontoMayor(facturasSelected: FacturasI[]): boolean {
    return facturasSelected.some(factura => {
      if (!factura.select) return false;

      const monto = this.parseMonto(factura.monto);
      const total_plus_mora = this.parseMonto(this.getMontoTotalFactura(factura.balance, factura.mora));

      return monto > total_plus_mora + 0.4;
    });
  }
}
