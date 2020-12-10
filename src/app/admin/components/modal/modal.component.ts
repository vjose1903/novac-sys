import { Component, OnInit, Input, OnChanges, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService } from './modal.service';
import { DBservice } from '../../../core/services/bdservice.service';
import { TablasService, obj_paginate } from '../tablas/tablas.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { NgxExtendedPdfViewerService } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  altoDiv;
  pdfSrc = 'https://vadimdez.github.io/ng2-pdf-viewer/assets/pdf-test.pdf';
  showModal = false;

  seleccionModal: any;
  tipoModal;
  paraFiltroClientes: any;
  paraFiltroSuplidor: any;
  tituloModal;
  mostrar_para: any;
  identificadorFact: any;
  tipoDevuelta: any;
  cant_notas_credito = 0;
  cant_notas_debito = 0;
  index;
  fecha_articulo: any;

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    if (this.showModal) {
      const obj = {
        total: 0,
        tabla: 'tabla',
      };
      this.tServ.Func_total_paginas(obj);
      this.mServ.func_tabla_modal_change(undefined);
      if (this.tipoModal === 'buscarArticulo') {
        this.mServ.pressEsc(this.index);
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
  infoSuplidor = [
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
  constructor(
    private mServ: ModalService,
    private dbServ: DBservice,
    private tServ: TablasService,
    private pdfService: NgxExtendedPdfViewerService,
  ) {}

  element: HTMLElement;
  subShow: Subscription;
  subTipo: Subscription;
  subSelec: Subscription;
  // subCalcularHeigth: Subscription;

  ngOnInit() {
    this.subShow = this.mServ.SHOWMODAL.subscribe((res) => {
      if (res !== undefined && res !== null && !this.paraFiltroArticulos && !this.paraFiltroClientes) {
        this.showModal = res;
      }

      if (res === false) {
        this.showModal = res;
      }
    });

    this.subTipo = this.mServ.TIPOMODAL.subscribe((res) => {
      if (res !== undefined && res !== null) {
        this.tipoModal = res;
      }
    });

    this.subSelec = this.mServ.SELECCIONMODAL.subscribe((res) => {
      if (res !== undefined && res !== null) {
        if (res.filtrarArticulo || res.filtrarCliente || res.filtrarSuplidor) {
          this.seleccionModal = res.data;
        } else {
          this.seleccionModal = res;
        }

        this.paraFiltroArticulos = res.filtrarArticulo;
        this.paraFiltroClientes = res.filtrarCliente;
        this.paraFiltroSuplidor = res.filtrarSuplidor;
        this.fecha_articulo = res.fecha_articulo;
        this.metodo = res.metodo;
        this.identificadorFact = res.identificadorFact;
        this.index = res.index;

        // if (this.paraFiltroArticulos) {
        // } else if (this.paraFiltroClientes) {
        // } else if (this.paraFiltroSuplidor) {
        // }

        if (this.tipoModal === 'buscarArticulo') {
          this.renovarDataFiltros(obj_paginate, this.paraFiltroArticulos, this.fecha_articulo);
        } else if (this.tipoModal === 'buscarCliente') {
          this.tituloModal = 'Buscar cliente';
          this.renovarDataFiltros(obj_paginate, this.paraFiltroClientes, this.fecha_articulo);
        } else {
          this.tituloModal = 'Buscar suplidor';
          this.renovarDataFiltros(obj_paginate, this.paraFiltroSuplidor, this.fecha_articulo);
        }

        if (this.tipoModal === 'mostrarFactura' && res) {
          this.mostrar_para = res.mostrarFacturaPara;

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
    // this.subCalcularHeigth.unsubscribe();
    this.reinicioModal();
  }

  ngOnChanges(simpleChanges) {
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

  accion(arg, tipo_?) {
    let obj = {};

    if (tipo_) {
      obj = { tipo: tipo_, body: arg };
    } else {
      obj = arg;
    }

    this.mServ.ModalDecision(obj);
    this.reinicioModal();
  }

  getDevuelta(arg) {
    const obj = { dinero: arg.dinero, devuelta: arg.devuelta, forma_pago: arg.forma_pago, decision_cambio: arg.decision_cambio };
    this.devolverCLick(obj);
    this.reinicioModal();
  }

  reinicioModal() {
    this.mServ.modalTipo(undefined);
    this.mServ.mostrarModal(false);
    this.mServ.ModalSeleccion(undefined);
    // this.mServ.ModalTablaHeight(false);
    this.mServ.ModalObj(undefined);
    this.mServ.ModalIndex(undefined);
    this.mServ.getArticuloFiltradoPorCodigo(undefined);
    this.paraFiltroArticulos = undefined;
    this.paraFiltroClientes = undefined;
    this.paraFiltroSuplidor = undefined;
    this.cant_notas_credito = 0;
    this.cant_notas_debito = 0;
  }

  formReporteAccion(arg) {
    const bool = arg.bool;
    const obj_ = arg.obj;

    let obj;
    obj = {
      data: obj_,
      tipo_modal: this.tipoModal,
    };

    if (!bool) obj = undefined;

    this.mServ.ModalObj(obj);
    this.reinicioModal();
  }

  devolverCLick(arg) {
    const obj = {
      data: arg,
      tipo_modal: this.tipoModal,
    };

    if (this.tipoModal === 'buscarArticulo') {
      obj['index'] = this.index;
    }

    this.mServ.ModalObj(obj);
  }

  noArticulo() {
    this.reinicioModal();
    this.mServ.ModalIndex(this.index);
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

  articuloFiltradoPorCodigo(articulo) {
    const obj = {
      data: articulo,
      index: this.index,
      tipo_modal: this.tipoModal,
    };

    this.mServ.getArticuloFiltradoPorCodigo(obj);

    this.reinicioModal();
  }

  async renovarDataFiltros(e, buscando?, fecha_articulo?) {
    const page = e.page;
    const per_page = e.per_page;
    let palabra_a_buscar = ' ';

    if (buscando) {
      palabra_a_buscar = buscando === '' || buscando === null || buscando === undefined ? ' ' : buscando;
    } else {
      palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;
    }

    console.log(`palabra_a_buscar--> ${typeof palabra_a_buscar} (${palabra_a_buscar})`);
    console.log('this.tipoModal ==> ', this.tipoModal);

    if (this.tipoModal === 'buscarArticulo') {
      try {
        const is_compra = this.metodo === 'compra' ? true : false;

        const res = await this.dbServ.getArticulosFiltrados(palabra_a_buscar, page, per_page, true, is_compra, fecha_articulo, 'todos').toPromise();
        console.log('articulos --> ', res);

        if (res.data) {
          this.seleccionModal = res.data;
          if (this.seleccionModal.length === 0) {
            this.noArticulo();
          }
          this.showModal = true;
          const obj = {
            total: res.total_registros,
            tabla: 'filtroArticulos',
          };
          this.tServ.Func_total_paginas(obj);
        } else {
          this.articuloFiltradoPorCodigo(res);
        }
      } catch (error) {
        console.error(error);
        this.dbServ.toastError('Error buscando articulos registrados.', 'ERROR', true);
        this.mServ.mostrarModal(false);
      }
    } else if (this.tipoModal === 'buscarCliente') {
      try {
        const res = await this.dbServ.getClientesFiltrados(palabra_a_buscar, page, per_page, true).toPromise();
        console.log('clientes --> ', res);
        this.seleccionModal = undefined;

        if (res.data.length === 0) {
          this.dbServ.toastWarning('No existe cliente con el nombre introducido', 'AVISO', true);
          setTimeout(() => {
            this.mServ.mostrarModal(false);
          }, 250);
        } else {
          res.data.map(async (cli) => {
            cli.nombre = GLOBAL.Capitalice(cli.nombre);
            cli.apellido = GLOBAL.Capitalice(cli.apellido);
            cli.documento_identidad = await cli.documentos_de_identidad.filter((doc) => doc.principal === true)[0].documento;
            // cli.documento_identidad = cli.documento_de_identidad ? (cli.documento_de_identidad.documento ? cli.documento_de_identidad.documento : '---------') : '---------';
            return cli;
          });

          this.seleccionModal = res.data;
          setTimeout(() => {
            this.showModal = true;
          }, 250);
          const obj = {
            total: res.total_registros,
            tabla: 'filtroCliente',
          };
          this.tServ.Func_total_paginas(obj);
        }
      } catch (error) {
        console.error(error);
        this.dbServ.toastError('Error buscando clientes registrados.', 'ERROR', true);
        this.mServ.mostrarModal(false);
      }
    } else if (this.tipoModal === 'buscarSuplidor') {
      try {
        const res = await this.dbServ.getSuplidoresFiltrados(palabra_a_buscar, page, per_page, true).toPromise();
        console.log('suplidores --> ', res);

        this.seleccionModal = undefined;
        res.data.map(async (supli) => {
          supli.nombre = GLOBAL.Capitalice(supli.nombre);
          supli.documento_identidad = await supli.documentos_de_identidad.filter((doc) => doc.principal === true)[0].documento;
          return supli;
        });
        this.seleccionModal = res.data;

        if (res.data.length === 0) {
          this.dbServ.toastWarning('No existe suplidor con el nombre introducido', 'AVISO', true);
          setTimeout(() => {
            this.mServ.mostrarModal(false);
          }, 250);
        }
        const obj = {
          total: res.total_registros,
          tabla: 'filtroSuplidor',
        };
        this.tServ.Func_total_paginas(obj);
      } catch (error) {
        console.error(error);
        this.dbServ.toastError('Error buscando clientes registrados.', 'ERROR', true);
        this.mServ.mostrarModal(false);
      }
    }
  }
}
