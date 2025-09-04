import { computed, Injectable, signal } from '@angular/core';
import { tipoPagoE } from './lista-pagos/pagos.config';

@Injectable({
  providedIn: 'root',
})
export class PagosService {
  constructor() {}

  tipoPago = signal<tipoPagoE>(tipoPagoE.recibosIngresos);

  isPagoFactura = computed(() => this.tipoPago() == tipoPagoE.pagosFacturas);
  isReciboIngreso = computed(() => this.tipoPago() == tipoPagoE.recibosIngresos);
}
