import { Injectable } from '@angular/core';
import {  tipoPagoE } from './lista-pagos/pagos.config';

@Injectable({
  providedIn: 'root',
})
export class PagosService {
  constructor() {}
  tipoPago;

  public get isPagoFactura(): boolean {
    return this.tipoPago == tipoPagoE.pagosFacturas;
  }

  public get isReciboIngreso(): boolean {
    return this.tipoPago == tipoPagoE.recibosIngresos;
  }
}
