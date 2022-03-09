import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  // INITCAMBIOMENU = new BehaviorSubject<any>(undefined);
  DESICIONCAMBIOMENU = new BehaviorSubject<any>(undefined);
  FACTURAGUARDADA = new BehaviorSubject<any>(undefined);
  CHECKCUADRETODAY = new BehaviorSubject<any>(false);
  REFRESFACTURAS = new BehaviorSubject<boolean>(false);
  SACARFACTURA = new BehaviorSubject<boolean>(false);

  constructor() {}

  public factura_guardada;

  nextCheckCuadreToday(nextValue) {
    this.CHECKCUADRETODAY.next(nextValue);
  }

  nextSacar(nextValue) {
    this.SACARFACTURA.next(nextValue);
  }

  nextRefresh(nextValue) {
    this.REFRESFACTURAS.next(nextValue);
  }

  nextFacturaGuardada(nextValue) {
    this.FACTURAGUARDADA.next(nextValue);
  }

  // nextCambioMenu(nextValue) {
  //   this.INITCAMBIOMENU.next(nextValue);
  // }

  nextDecisionCambioMenu(nextValue) {
    this.DESICIONCAMBIOMENU.next(nextValue);
  }
}
