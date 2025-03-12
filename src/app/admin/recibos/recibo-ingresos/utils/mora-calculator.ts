import { fun } from '../../../../core/services/functions.service';
import { FacturasI } from '../../../facturacion/factura';

export class MoraCalculator {
  fecha_actual: number;
  constructor(public factura: FacturasI) {
    this.fecha_actual = new Date().setHours(0, 0, 0, 0);
  }

  get hasMora() {
    this.fecha_actual = new Date().setHours(0, 0, 0, 0);
    const hasMora = this.fecha_actual > new Date(this.getFechaCompare()).setHours(0, 0, 0, 0);
    return hasMora;
  }

  test(porcentaje: number | string) {
    const mora = this.getMora(porcentaje );
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

  getDiasRetraso() {
    // Calcular días de retraso
    const fechaVencimiento = new Date(this.getFechaCompare()).setHours(0, 0, 0, 0);
    const fechaActual = new Date().setHours(0, 0, 0, 0);
    const diasRetraso = Math.floor((fechaActual - fechaVencimiento) / (1000 * 60 * 60 * 24));

    return diasRetraso;
  }

  getFechaCompare() {
    const pagos = this.factura?.pagos || [];

    if (pagos.length > 0 && this.fecha_actual > new Date(this.factura.fecha_vencimiento).setHours(0, 0, 0, 0)) {
      const pago = pagos.sort((a, b) => new Date(b.fecha_equivalente).getTime() - new Date(a.fecha_equivalente).getTime())[0];
      return pago.fecha_equivalente;
    }

    return this.factura.fecha_vencimiento;
  }
}

export const mora_personalizada = 'personalizada';
