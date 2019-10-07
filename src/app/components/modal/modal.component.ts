import { Component, OnInit, Output, EventEmitter, Input, OnChanges, ElementRef } from '@angular/core';
import { TIPOMODAL, SHOWMODAL, SELECCIONMODAL, DECISIONMODAL, INDEXTOFOCUS } from '../../core/services/GLOBAL';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit, OnChanges {
  // Inputs
  @Input() showModal = false;
  @Input() seleccionModal: any;
  @Input() ModalEliminar = false;

  @Input() tipoModal;

  @Input() listaArticulos: any;
  infoArticulos = [
    {
      titulo: 'Descripción',
      key: 'nombre',
    },
  ];

  // Outputs
  @Output() btnInsideClick = new EventEmitter<boolean>();
  @Output() reinicioVariablesModal = new EventEmitter<any>();
  @Output() clickRowModal = new EventEmitter<any>();
  @Output() noArticuloEncontrado = new EventEmitter<any>();

  paraFiltroArticulos;
  constructor() {}

  element: HTMLElement;
  ngOnInit() {}

  ngOnChanges() {
    if (this.seleccionModal) {
      if (this.tipoModal === 'buscar') {
        this.paraFiltroArticulos = (this.seleccionModal as any).filtrar;
      }
    }
  }

  accion(arg) {
    this.btnInsideClick.emit(arg);
    this.showModal = false;
  }

  reinicioModal() {
    console.log('reinicio variables modal');

    TIPOMODAL.next('');
    SHOWMODAL.next(false);
    SELECCIONMODAL.next({});
  }

  devolverCLick(arg) {
    const obj = JSON.parse(JSON.stringify(arg));
    if (this.tipoModal === 'buscar') {
      obj.index = this.seleccionModal.index;
    }

    this.clickRowModal.emit(obj);
  }

  moverFoco() {
    this.showModal = false;
    SHOWMODAL.next(false);
  }

  noArticulo() {
    this.showModal = false;
    SHOWMODAL.next(false);
    this.noArticuloEncontrado.emit(this.seleccionModal.index);
  }

  prueba2() {
    console.log('entro prueba 2');
  }
  prueba() {
    if (this.tipoModal === 'buscar') {
      this.element = document.getElementById('tablaSearch') as HTMLElement;
      this.element.focus();
    }
  }
}
