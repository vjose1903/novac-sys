import { DateUtils } from '@vjose1903/dateutils';
import { fun } from '@core/services/functions.service';
import { FacturasI, Pago } from '../../../facturacion/factura';

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
      this.abonos_a_mora += fun.desformatearStNumber(pago.mora);
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

    if (!this.hasMora || porcentaje === mora_personalizada) return '0.00';

    // Calcular la mora basada en el porcentaje del balance
    const balanceMora = this.factura.balance * (Number(porcentaje) / 100);

    // Obtener días del mes actual
    const fechaActual = new Date();
    const diasEnMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0).getDate();

    // Calcular mora final: (balance * porcentaje) * diasRetraso / diasEnMes
    let mora = (balanceMora * this.getDiasRetraso()) / diasEnMes;

    if (this.abonos_a_mora > 0) {
      let abono_mora = this.abonos_a_mora;

      if (mora - this.abonos_a_mora <= 0) {
        // Calcular porcentaje de la mora pagada
        const porcentajePagado = this.abonos_a_mora / ((this.factura.balance * (2 / 100) * this.getDiasRetraso()) / diasEnMes);

        // Ajustar la nueva mora proporcionalmente
        mora = mora * (1 - porcentajePagado);
      } else {
        mora = mora - abono_mora;
      }
    }

    return formateado ? fun.roundNumberToDecimal(mora) : mora;
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
