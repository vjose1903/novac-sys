import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private initcambioMenu = new BehaviorSubject<any>(undefined);
  private desicionCambioMenu = new BehaviorSubject<any>(undefined);
  DESICIONCAMBIOMENU = this.desicionCambioMenu.asObservable();
  INITCAMBIOMENU = this.initcambioMenu.asObservable();

  constructor() {}

  nextCambioMenu(nextValue) {
    this.initcambioMenu.next(nextValue);
  }

  nextDecisionCambioMenu(nextValue) {
    this.desicionCambioMenu.next(nextValue);
  }
}
