import { Component, OnInit, Output, EventEmitter, Input, OnChanges, ElementRef } from '@angular/core';

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
  @Input() ModalShearch = false;

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

  paraFiltroArticulos;
  constructor() {}

  element: HTMLElement;
  ngOnInit() {}

  ngOnChanges() {
    if (this.ModalShearch === true) {
      this.paraFiltroArticulos = this.seleccionModal;
    }
  }

  accion(arg) {
    this.btnInsideClick.emit(arg);
    this.showModal = false;
  }

  reinicioModal() {
    this.reinicioVariablesModal.emit();
  }

  devolverCLick(arg) {
    this.clickRowModal.emit(arg);
  }
  prueba() {
    console.log('algo');
    if (this.ModalShearch) {
      this.element = document.getElementById('tablaSearch') as HTMLElement;
      this.element.focus();
    }
  }
}
