import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private tipoModal = new BehaviorSubject<any>(undefined);
  private showModal = new BehaviorSubject<boolean>(undefined);
  private calcularHeight = new BehaviorSubject<boolean>(false);
  private seleccionModal = new BehaviorSubject<any>(undefined);
  private decisionModal = new BehaviorSubject<any>(undefined);
  private ObjDevuelto = new BehaviorSubject<any>(undefined);
  private indexToFocus = new BehaviorSubject<any>(undefined);
  private press_Esc = new BehaviorSubject<any>(undefined);
  private tabla_modal_change = new BehaviorSubject<any>(undefined);

  TIPOMODAL = this.tipoModal.asObservable();
  SHOWMODAL = this.showModal.asObservable();
  CALCULARHEIGHT = this.calcularHeight.asObservable();
  SELECCIONMODAL = this.seleccionModal.asObservable();
  DECISIONMODAL = this.decisionModal.asObservable();
  OBJDEVUELTO = this.ObjDevuelto.asObservable();
  INDEXTOFOCUS = this.indexToFocus.asObservable();
  PRESSESC = this.press_Esc.asObservable();
  TABLA_MODAL_CHANGE = this.tabla_modal_change.asObservable();

  constructor() {}

  func_tabla_modal_change(nextValue) {
    this.tabla_modal_change.next(nextValue);
  }

  mostrarModal(nextValue) {
    this.showModal.next(nextValue);
  }

  modalTipo(nextValue) {
    this.tipoModal.next(nextValue);
  }

  ModalSeleccion(nextValue) {
    this.seleccionModal.next(nextValue);
  }

  ModalTablaHeight(nextValue) {
    this.calcularHeight.next(nextValue);
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

  pressEsc(nextValue) {
    this.press_Esc.next(nextValue);
  }
}
