import { DateUtils } from '@vjose1903/dateutils';
import { fun } from '@core/services/functions.service';
import { FacturasI, Pago } from '../../../facturacion/factura';
import { Ss } from '@core/services/singleton.service';
import Big from 'big.js';

export class MoraCalculator {
  last_pago_valido: Pago;
  factura_is_vencida: boolean;
  abonos_a_mora: number = 0;

  constructor(public factura: FacturasI) {
    const fechaActual = this.getFechaActual();

    const pagos = this.factura.pagos.sort((a, b) => new Date(b.fecha_equivalente).getTime() - new Date(a.fecha_equivalente).getTime());

    // sumar los pagos recientes que no tienen pago a capital
    for (let i = 0; i < pagos.length; i++) {
      const pago = pagos[i];
      if (fun.desformatearStNumber(pago.deposito) > 0) break;
      this.abonos_a_mora = Big(this.abonos_a_mora).plus(fun.desformatearStNumber(pago.mora)).round(2).toNumber();
    }

    this.last_pago_valido = pagos.find(pago => fun.desformatearStNumber(pago.deposito) > 0);

    this.factura_is_vencida = fechaActual > new Date(this.factura.fecha_vencimiento).setHours(1, 0, 0, 0);
  }

  private getFechaActual(): number {
    return new Date().setHours(1, 0, 0, 0);
  }

  get hasMora() {
    const fechaActual = this.getFechaActual();
    return fechaActual > new Date(this.getFechaCompare()).setHours(1, 0, 0, 0);
  }

  test(print) {
    this.getDiasRetraso(print);
  }

  getMora(args: { porcentaje: number | string; formateado?: boolean }): string | number {
    let { porcentaje, formateado = true } = args;

    if (Ss.configServ.config?.usa_mora !== true) return formateado ? '0.00' : 0;

    if (!this.hasMora || porcentaje === mora_personalizada) return '0.00';

    // Calcular la mora basada en el porcentaje del balance
    const balance = Big(this.factura.balance);
    const porcentajeValue = Big(porcentaje);

    // Obtener días del mes actual
    const fechaActual = new Date();
    const diasEnMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0).getDate();

    // Calcular mora final: (balance * porcentaje) * diasRetraso / diasEnMes
    let mora = balance.times(porcentajeValue).div(100).times(this.getDiasRetraso()).div(diasEnMes);

    if (this.abonos_a_mora > 0) {
      const abono_mora = Big(this.abonos_a_mora);

      if (mora.minus(abono_mora).lte(0)) {
        // Calcular porcentaje de la mora pagada
        const moraBase = balance.times(2).div(100).times(this.getDiasRetraso()).div(diasEnMes);
        const porcentajePagado = abono_mora.div(moraBase);

        // Ajustar la nueva mora proporcionalmente
        mora = mora.times(Big(1).minus(porcentajePagado));
      } else {
        mora = mora.minus(abono_mora);
      }
    }

    return formateado ? mora.round(2).toFixed(2) : mora.toNumber();
  }

  getDiasRetraso(print: boolean = false) {
    // Calcular días de retraso
    const fechaVencimiento = new Date(this.getFechaCompare());
    const fechaActual = new Date();

    const diasRetraso = DateUtils.diffDays(fechaActual, fechaVencimiento);
    return diasRetraso;
  }

  getFechaCompare() {
    const pagos = this.factura?.pagos || [];

    if (pagos.length > 0 && this.factura_is_vencida) {
      if (this.last_pago_valido) {
        return this.last_pago_valido.fecha_equivalente;
      }
    }

    return this.factura.fecha_vencimiento;
  }
}

export const mora_personalizada = 'personalizada';
