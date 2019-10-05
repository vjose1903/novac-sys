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

  @Input() tipoModal = '';

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
  ngOnInit() {
    console.log('entro en Modal');
  }

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
    this.reinicioVariablesModal.emit();
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
  }
  noArticulo() {
    this.showModal = false;
    this.noArticuloEncontrado.emit(this.seleccionModal.index);
  }

  prueba() {
    if (this.tipoModal === 'buscar') {
      this.element = document.getElementById('tablaSearch') as HTMLElement;
      this.element.focus();
    }
  }
}
