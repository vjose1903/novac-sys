import { fun } from '../../../../core/services/functions.service';
import { FacturasI } from '../../../facturacion/factura';

export class MoraCalculator {
  constructor(public factura: FacturasI) {}

  get hasMora() {
    const fecha_actual = new Date().getTime();
    const hasMora = fecha_actual > new Date(this.getFechaCompare()).getTime();
    return hasMora;
  }


  test(){
    console.log('  ');

    const fecha_actual = new Date().getTime();
    console.log('fecha_actual ', fecha_actual);
    console.log('this.getFechaCompare() ', this.getFechaCompare());
    const hasMora = fecha_actual > new Date(this.getFechaCompare()).getTime();
    console.log('hasMora ', hasMora);
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
    const fechaVencimiento = new Date(this.getFechaCompare());
    const fechaActual = new Date();
    const diasRetraso = Math.floor((fechaActual.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));

    return diasRetraso;
  }

  getFechaCompare() {
    const fecha_actual = new Date().getTime();
    const pagos = this.factura?.pagos || [];

    if (pagos.length > 0 && fecha_actual > new Date(this.factura.fecha_vencimiento).getTime()) {
      const pago = pagos.sort((a, b) => new Date(b.fecha_equivalente).getTime() - new Date(a.fecha_equivalente).getTime())[0];
      return pago.fecha_equivalente;
    }

    return this.factura.fecha_vencimiento;
  }
}

export const mora_personalizada = 'personalizada';
