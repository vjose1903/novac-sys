import { DateUtils } from '../../../../core/typescript/date.utils';
import { fun } from '../../../../core/services/functions.service';
import { FacturasI } from '../../../facturacion/factura';

export class MoraCalculator {
  constructor(public factura: FacturasI) {}

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

  getMora(porcentaje: number | string): string {
    if (!this.hasMora || porcentaje === mora_personalizada) return '0';

    // Calcular la mora basada en el porcentaje del balance
    const balanceMora = this.factura.balance * (Number(porcentaje) / 100);

    // Obtener días del mes actual
    const fechaActual = new Date();
    const diasEnMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0).getDate();

    // Calcular mora final: (balance * porcentaje) * diasRetraso / diasEnMes
    return fun.roundNumberToDecimal((balanceMora * this.getDiasRetraso()) / diasEnMes);
  }

  getDiasRetraso(print: boolean = false) {
    // Calcular días de retraso
    const fechaVencimiento = new Date(this.getFechaCompare());
    const fechaActual = new Date();

    const diasRetraso = DateUtils.diffDays(fechaActual, fechaVencimiento);

    return diasRetraso;
  }

  getFechaCompare() {
    const fechaActual = this.getFechaActual();
    const pagos = this.factura?.pagos || [];

    if (pagos.length > 0 && fechaActual > new Date(this.factura.fecha_vencimiento).setHours(1, 0, 0, 0)) {
      const pago = pagos.sort((a, b) => new Date(b.fecha_equivalente).getTime() - new Date(a.fecha_equivalente).getTime())[0];
      return pago.fecha_equivalente;
    }

    return this.factura.fecha_vencimiento;
  }
}

export const mora_personalizada = 'personalizada';
