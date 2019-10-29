import { Component, OnInit, Output, EventEmitter, Input, OnChanges, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit, OnChanges, OnDestroy {
  showModal = false;
  seleccionModal: any;
  tipoModal;

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    if (this.showModal) {
      if (this.tipoModal === 'buscar') {
        this.mServ.pressEsc(this.seleccionModal.index);
        setTimeout(() => {
          this.mServ.pressEsc(undefined);
        }, 1000);
      }
    }
  }

  @Input() listaArticulos: any;
  infoArticulos = [
    {
      titulo: 'Descripción',
      key: 'nombre',
    },
  ];

  paraFiltroArticulos;

  constructor(private mServ: ModalService) {}

  element: HTMLElement;
  ngOnInit() {
    this.mServ.SHOWMODAL.subscribe(res => {
      if (res !== undefined) {
        this.showModal = res;
      }
    });
    this.mServ.TIPOMODAL.subscribe(res => {
      if (res !== undefined) {
        this.tipoModal = res;
      }
    });
    this.mServ.SELECCIONMODAL.subscribe(res => {
      if (res !== undefined) {
        this.seleccionModal = res;
        this.paraFiltroArticulos = res.filtrar;
      }
    });
  }

  ngOnDestroy() {}

  ngOnChanges() {
    // if (this.seleccionModal) {
    //   if (this.tipoModal === 'buscar') {
    //     this.paraFiltroArticulos = (this.seleccionModal as any).filtrar;
    //   }
    // }
  }

  accion(arg) {
    this.mServ.ModalDecision(arg);
    this.reinicioModal();
  }

  reinicioModal() {
    this.mServ.modalTipo(undefined);
    this.mServ.mostrarModal(false);
    this.mServ.ModalSeleccion(undefined);
  }

  devolverCLick(arg) {
    const obj = JSON.parse(JSON.stringify(arg));
    if (this.tipoModal === 'buscar') {
      obj.index = this.seleccionModal.index;
    }

    this.mServ.ModalObj(obj);
  }

  noArticulo() {
    this.reinicioModal();
    this.mServ.ModalIndex(this.seleccionModal.index);
  }

  prueba(arg) {
    console.log(arg);

    //   if (this.tipoModal === 'buscar') {
    //     this.element = document.getElementById('tablaSearch') as HTMLElement;
    //     this.element.focus();
    //   }
  }
}
