import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private initcambioMenu = new BehaviorSubject<boolean>(false);
  private desicionCambioMenu = new BehaviorSubject<boolean>(false);
  DESICIONCAMBIOMENU = this.desicionCambioMenu.asObservable();
  INITCAMBIOMENU = this.initcambioMenu.asObservable();

  constructor() {}

  nexCambioMenu(nextValue) {
    this.initcambioMenu.next(nextValue);
  }
  nexDecisionCambioMenu(nextValue) {
    this.desicionCambioMenu.next(nextValue);
  }
}
