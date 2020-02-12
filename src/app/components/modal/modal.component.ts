import { Component, OnInit, Output, EventEmitter, Input, OnChanges, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService } from './modal.service';
import { DBservice } from '../../core/services/bdservice.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit, OnChanges, OnDestroy {
  showModal = false;
  seleccionModal: any;
  tipoModal;
  paraFiltroClientes: any;
  tituloModal;
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
    {
      titulo: 'Existencia',
      key: 'cantidades',
      cantidades: true,
    },
  ];

  paraFiltroArticulos;
  metodo;
  infoCliente = [
    {
      titulo: 'Nombre',
      key: 'nombre',
    },
    {
      titulo: 'Telefono',
      key: 'telefono',
    },
    {
      titulo: 'Doc. identidad',
      key: 'documento_identidad',
    },
    {
      titulo: 'Direccion',
      key: 'direccion',
    },
  ];
  constructor(private mServ: ModalService, private dbServ: DBservice) {}

  element: HTMLElement;
  subShow: Subscription;
  subTipo: Subscription;
  subSelec: Subscription;
  ngOnInit() {
    this.subShow = this.mServ.SHOWMODAL.subscribe(res => {
      if (res !== undefined && res !== null) {
        this.showModal = res;
      }
    });
    this.subTipo = this.mServ.TIPOMODAL.subscribe(res => {
      if (res !== undefined && res !== null) {
        this.tipoModal = res;
      }
    });
    this.subSelec = this.mServ.SELECCIONMODAL.subscribe(res => {
      if (res !== undefined && res !== null) {
        this.seleccionModal = res;
        this.paraFiltroArticulos = res.filtrar;
        this.paraFiltroClientes = res.filtrarCliente;
        this.metodo = res.metodo;

        if (this.tipoModal === 'buscarCliente' && res.limite_credito !== undefined) {
          this.tituloModal = 'Buscar cliente';
        } else {
          this.tituloModal = 'Buscar suplidor';
        }
      }
    });
  }

  ngOnDestroy() {
    this.subShow.unsubscribe();
    this.subTipo.unsubscribe();
    this.subSelec.unsubscribe();
  }

  ngOnChanges() {
    // if (this.seleccionModal) {
    //   if (this.tipoModal === 'buscar') {
    //     this.paraFiltroArticulos = (this.seleccionModal as any).filtrar;
    //   }
    // }
  }

  getDatePendiente(date) {
    const obj = { bool: true, Date: date };
    this.accion(obj);
  }

  accion(arg) {
    this.mServ.ModalDecision(arg);
    this.reinicioModal();
  }
  getDevuelta(arg) {
    const obj = { devuelta: arg.devuelta, forma_pago: arg.forma_pago };
    this.devolverCLick(obj);
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
    obj.tipoModal = this.tipoModal;

    this.mServ.ModalObj(obj);
  }

  noArticulo() {
    this.reinicioModal();
    this.mServ.ModalIndex(this.seleccionModal.index);
  }

  prueba() {
    if (this.tipoModal === 'buscar') {
      this.element = document.getElementById('tablaSearch');
      setTimeout(() => {
        this.element.focus();
        this.element.click();
      }, 5);
    }
  }
}
