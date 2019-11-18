import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ObservableServcie {
  private articulos = new BehaviorSubject<any>(undefined);
  private tipos_facturas = new BehaviorSubject<any>(undefined);
  private secuencia_facturas = new BehaviorSubject<any>(undefined);

  ARTICULOS = this.articulos.asObservable();
  TIPOS_FACTURAS = this.tipos_facturas.asObservable();
  SECUENCIA_FACTURAS = this.secuencia_facturas.asObservable();

  constructor() {}

  next_articulo(nextValue) {
    this.articulos.next(nextValue);
  }

  next_tipo_factura(nextValue) {
    this.tipos_facturas.next(nextValue);
  }
  next_secuencia_factura(nextValue) {
    this.secuencia_facturas.next(nextValue);
  }
}
