import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private initcambioMenu = new BehaviorSubject<any>(undefined);
  private desicionCambioMenu = new BehaviorSubject<any>(undefined);

  private facturaGuardada = new BehaviorSubject<any>(undefined);

  private checkCuadreToday = new BehaviorSubject<any>(false);
  private refresFacturas = new BehaviorSubject<boolean>(false);
  private sacarFactura = new BehaviorSubject<boolean>(false);

  DESICIONCAMBIOMENU = this.desicionCambioMenu.asObservable();
  INITCAMBIOMENU = this.initcambioMenu.asObservable();

  FACTURAGUARDADA = this.facturaGuardada.asObservable();

  CHECKCUADRETODAY = this.checkCuadreToday.asObservable();
  REFRESHFACTURAS = this.refresFacturas.asObservable();
  SACARFACTURA = this.sacarFactura.asObservable();

  constructor() {}

  public factura_guardada;

  nextCheckCuadreToday(nextValue) {
    this.checkCuadreToday.next(nextValue);
  }


  nextSacar(nextValue) {
    this.sacarFactura.next(nextValue);
  }

  nextRefresh(nextValue) {
    this.refresFacturas.next(nextValue);
  }

  nextFacturaGuardada(nextValue) {
    this.facturaGuardada.next(nextValue);
  }

  nextCambioMenu(nextValue) {
    this.initcambioMenu.next(nextValue);
  }

  nextDecisionCambioMenu(nextValue) {
    this.desicionCambioMenu.next(nextValue);
  }
}
