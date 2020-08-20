import { Component, OnInit, Input, OnChanges, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService } from './modal.service';
import { DBservice } from '../../../core/services/bdservice.service';
import { TablasService, obj_paginate } from '../tablas/tablas.service';
import { GLOBAL } from '../../../core/services/GLOBAL';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  altoDiv;

  showModal = false;

  seleccionModal: any;
  tipoModal;
  paraFiltroClientes: any;
  tituloModal;
  lugar: any;
  identificadorFact: any;
  tipoDevuelta: any;
  cant_notas_credito = 0;
  cant_notas_debito = 0;

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    if (this.showModal) {
      this.tServ.Func_total_paginas(0);
      this.mServ.func_tabla_modal_change(undefined);
      if (this.tipoModal === 'buscarArticulo') {
        this.mServ.pressEsc(this.seleccionModal.index);
        setTimeout(() => {
          this.mServ.pressEsc(undefined);
        }, 1000);
      } else {
        this.mServ.pressEsc({});
      }
    }
  }

  @Input() listaArticulos: any;
  texto: any;

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
      titulo: 'Apellido',
      key: 'apellido',
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
  constructor(private mServ: ModalService, private dbServ: DBservice, private tServ: TablasService) {}

  element: HTMLElement;
  subShow: Subscription;
  subTipo: Subscription;
  subSelec: Subscription;
  subCalcularHeigth: Subscription;

  ngOnInit() {
    this.subShow = this.mServ.SHOWMODAL.subscribe((res) => {
      if (res !== undefined && res !== null) {
        this.showModal = res;
      }
    });

    this.subCalcularHeigth = this.mServ.CALCULARHEIGHT.subscribe((res) => {
      if (res) {
        console.log('entro a calcular el height');

        setTimeout(() => {
          if (document.getElementsByClassName('ui-dialog-content')) {
            this.altoDiv = (document.getElementsByClassName('ui-dialog-content')[0] as any).offsetHeight + 30;
          }
        }, 10);
      } else {
        console.log('NO entro a calcular el height');
      }
    });

    this.subTipo = this.mServ.TIPOMODAL.subscribe((res) => {
      if (res !== undefined && res !== null) {
        this.tipoModal = res;
      }
    });

    this.subSelec = this.mServ.SELECCIONMODAL.subscribe((res) => {
      if (res !== undefined && res !== null) {
        if (res.filtrarArticulo || res.filtrarCliente) {
          this.seleccionModal = res.data;
        } else {
          this.seleccionModal = res;
        }

        this.paraFiltroArticulos = res.filtrarArticulo;
        this.paraFiltroClientes = res.filtrarCliente;
        this.metodo = res.metodo;
        this.identificadorFact = res.identificadorFact;

        console.log('this.paraFiltroArticulos, ', this.paraFiltroArticulos);
        if (this.paraFiltroArticulos) {
          this.renovarDataFiltros(obj_paginate, this.paraFiltroArticulos);
        } else if (this.paraFiltroClientes) {
          this.renovarDataFiltros(obj_paginate, this.paraFiltroClientes);
        }

        if (this.tipoModal === 'buscarCliente') {
          this.tituloModal = 'Buscar cliente';
        } else {
          this.tituloModal = 'Buscar suplidor';
        }

        if (this.tipoModal === 'mostrarFactura' && res) {
          this.lugar = res.mostrarFacturaPara;

          if (this.seleccionModal.tiene_nota && this.seleccionModal.notas.length > 0) {
            for (let i = 0; i < this.seleccionModal.notas.length; i++) {
              const nota = this.seleccionModal.notas[i];
              if (nota.tipo_factura_id === 5) {
                this.cant_notas_credito++;
              }
              if (nota.tipo_factura_id === 4) {
                this.cant_notas_debito++;
              }
            }
          }
        }

        if (this.tipoModal === 'cambio' && res) {
          if (this.seleccionModal.tipo__) {
            this.tipoDevuelta = this.seleccionModal.tipo__;
          }
        }
        if (res.texto_modal) {
          this.texto = res.texto_modal;
        }
      }
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.subShow.unsubscribe();
    this.subTipo.unsubscribe();
    this.subSelec.unsubscribe();
    this.subCalcularHeigth.unsubscribe();
  }

  ngOnChanges() {
    // if (this.seleccionModal) {
    //   if (this.tipoModal === 'buscar') {
    //     this.paraFiltroArticulos = (this.seleccionModal as any).filtrar;
    //   }
    // }
  }

  // TablaChange(change) {
  //   this.mServ.func_tabla_modal_change(change);
  // }

  getDatePendiente(date) {
    const obj = { bool: true, Date: date };
    this.accion(obj);
  }

  accion(arg) {
    this.mServ.ModalDecision(arg);
    this.reinicioModal();
  }

  getDevuelta(arg) {
    const obj = { devuelta: arg.devuelta, forma_pago: arg.forma_pago, decision_cambio: arg.decision_cambio };
    this.devolverCLick(obj);
    this.reinicioModal();
  }

  reinicioModal() {
    this.mServ.modalTipo(undefined);
    this.mServ.mostrarModal(false);
    this.mServ.ModalSeleccion(undefined);
    this.mServ.ModalTablaHeight(false);
  }

  devolverCLick(arg) {
    const obj = JSON.parse(JSON.stringify(arg));
    if (this.tipoModal === 'buscarArticulo') {
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
    if (this.tipoModal === 'buscarArticulo') {
      this.element = document.getElementById('tablaSearch');
      setTimeout(() => {
        this.element.focus();
        this.element.click();
      }, 5);
    }
  }

  async renovarDataFiltros(e, buscando?) {
    const page = e.page;
    const per_page = e.per_page;
    let palabra_a_buscar = ' ';
    if (buscando) {
      palabra_a_buscar = buscando === '' || buscando === null || buscando === undefined ? ' ' : buscando;
    } else {
      palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;
    }

    if (this.paraFiltroArticulos) {
      // --------------------------------- ARTICULOS ---------------------------------
      try {
        this.seleccionModal = undefined;
        const res = await this.dbServ.getArticulosFiltrados(palabra_a_buscar, page, per_page, true).toPromise();

        this.seleccionModal = res.data;
        console.log('this.seleccionModal ', this.seleccionModal);

        this.tServ.Func_total_paginas(res.total_registros);
      } catch (error) {
        console.error(error);
        this.dbServ.toastError('Error buscando articulos registrados.', 'ERROR');
      }
    } else if (this.paraFiltroClientes) {
      // --------------------------------- CLIENTES ---------------------------------
      try {
        const res = await this.dbServ.getClientesFiltrados(palabra_a_buscar, page, per_page, true).toPromise();

        this.seleccionModal = undefined;

        res.data.map((cli) => {
          cli.nombre = GLOBAL.Capitalice(cli.nombre);
          cli.apellido = GLOBAL.Capitalice(cli.apellido);
          cli.documentos_de_identidad.map((docu) => {
            if (docu.principal) {
              cli.documento_identidad = docu.documento;
            }
          });
          return cli;
        });
        this.seleccionModal = res.data;

        this.tServ.Func_total_paginas(res.total_registros);
      } catch (error) {
        console.error(error);
        this.dbServ.toastError('Error buscando clientes registrados.', 'ERROR');
      }
    }
  }
}
