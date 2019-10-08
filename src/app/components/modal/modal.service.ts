import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private tipoModal = new BehaviorSubject<any>(undefined);
  private showModal = new BehaviorSubject<boolean>(undefined);
  private seleccionModal = new BehaviorSubject<any>(undefined);
  private decisionModal = new BehaviorSubject<any>(undefined);
  private ObjDevuelto = new BehaviorSubject<any>(undefined);
  private indexToFocus = new BehaviorSubject<any>(undefined);

  TIPOMODAL = this.tipoModal.asObservable();
  SHOWMODAL = this.showModal.asObservable();
  SELECCIONMODAL = this.seleccionModal.asObservable();
  DECISIONMODAL = this.decisionModal.asObservable();
  OBJDEVUELTO = this.ObjDevuelto.asObservable();
  INDEXTOFOCUS = this.indexToFocus.asObservable();

  constructor() {}

  mostrarModal(nextValue) {
    this.showModal.next(nextValue);
  }

  modalTipo(nextValue) {
    this.tipoModal.next(nextValue);
  }

  ModalSeleccion(nextValue) {
    this.seleccionModal.next(nextValue);
  }
  ModalDecision(nextValue) {
    this.decisionModal.next(nextValue);
  }
  ModalObj(nextValue) {
    this.ObjDevuelto.next(nextValue);
  }

  ModalIndex(nextValue) {
    this.indexToFocus.next(nextValue);
  }
}
