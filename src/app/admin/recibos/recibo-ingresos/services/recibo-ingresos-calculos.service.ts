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
    return Big(this.parseMonto(balance)).plus(this.parseMonto(mora)).round(2).toFixed(2);
  }

  isInvalidMonto(value: any): boolean {
    const monto = fun.desformatearStNumber(value);
    return isNaN(monto) || fun.isEmpty(monto);
  }

  formarDetalleRecibos(facturasSelected: FacturasI[], tipo_recibo: string) {
    const resultado = facturasSelected.reduce(
      (acc, fact) => {
        const detalle = this.getDetalleReciboFromFactura(fact, tipo_recibo);

        acc.detalle.push(detalle);
        acc.bruto = acc.bruto.plus(detalle.deposito);
        acc.mora = acc.mora.plus(detalle.mora);

        return acc;
      },
      { bruto: Big(0), mora: Big(0), detalle: [] as any[] }
    );

    const bruto = resultado.bruto.round(2);
    const mora = resultado.mora.round(2);

    return {
      bruto: bruto.toNumber(),
      mora: mora.toNumber(),
      total_recibo: bruto.plus(mora).round(2).toNumber(),
      detalle: resultado.detalle,
    };
  }

  getDetalleReciboFromFactura(fact: FacturasI, tipo_recibo: string) {
    const monto = Big(this.parseMonto(fact.monto));
    const mora = Big(this.parseMonto(fact.mora));
    const mora_received = monto.lt(mora) ? monto : mora;
    const deposito = monto.minus(mora_received);
    const deposito_recibido = deposito.gt(0) ? deposito : Big(0);

    return {
      cabecera_factura_id: fact.id,
      pago_total: fact.pagoT,
      deposito: deposito_recibido.round(2).toNumber(),
      mora: mora_received.round(2).toNumber(),
      descripcion: tipo_recibo === 'Pago factura' ? this.getDescripcionDetalle(fact) : '',
      pago_a_tiempo: fact.pago_a_tiempo,
    };
  }

  getDescripcionDetalle(fact: FacturasI) {
    return `${fact.pagoT ? 'Saldo' : 'Abono'} ${fact.numero_comprobante} ${moment(fact.fecha_equivalente).format('YYYY-MM-DD HH:mm:ss')}`;
  }

  getReciboPayload(params: { cliente_id: number; detalleYtotal: any; forma_pago: any; metodos_de_pago: Array<{ forma_pago: string; monto: number }>; devuelta: any; balance_cliente: number }) {
    return {
      cliente_id: params.cliente_id,
      bruto: params.detalleYtotal.bruto,
      mora: params.detalleYtotal.mora,
      total: params.detalleYtotal.total_recibo,
      forma_pago: params.forma_pago,
      metodos_de_pago: params.metodos_de_pago,
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
