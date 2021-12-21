import { Component, OnInit, Input, OnChanges, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService } from './modal.service';
import { DBservice } from '../../../core/services/bdservice.service';
import { TablasService } from '../tablas/tablas.service';
import { GLOBAL } from '../../../core/services/GLOBAL';
import { FunctionService } from '../../../core/services/functions.service';

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
  paraFiltroSuplidor: any;
  tituloModal;
  mostrar_para: any;
  identificadorFact: any;
  tipoDevuelta: any;
  cant_notas_credito = 0;
  cant_notas_debito = 0;
  index;
  fecha_articulo: any;
  returnArticulosSeleccionado = false;
  filtrar = false;
  dataFiltro;
  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    if (this.showModal) {
      this.showModal = false;
      const obj = {
        total: 0,
        tabla: 'tabla',
      };

      this.tServ.Func_total_paginas(obj);
      this.mServ.func_tabla_modal_change(undefined);

      if (this.tipoModal === 'buscarArticulo') {
        this.mServ.pressEsc(this.index);
        setTimeout(() => this.mServ.pressEsc(undefined), 1000);
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
  constructor(public mServ: ModalService, private dbServ: DBservice, private tServ: TablasService, public fun: FunctionService) {}

  element: HTMLElement;
  subShow: Subscription;
  subTipo: Subscription;
  subSelec: Subscription;
  // subCalcularHeigth: Subscription;

  ngOnInit() {
    this.subShow = this.mServ.SHOWMODAL.subscribe((res) => {
      if (this.fun.hasValue(res)) {
        if (!this.paraFiltroArticulos && !this.paraFiltroClientes && !this.paraFiltroSuplidor) this.showModal = res;

        if (res === false) {
          this.showModal = res;
          this.mServ.mostrarModal(undefined);
        }
      } else {
        this.showModal = false;
        this.reinicioModal();
      }
    });

    this.subTipo = this.mServ.TIPOMODAL.subscribe((res) => {
      if (this.fun.hasValue(res)) {
        this.tipoModal = res;
      }
    });

    this.subSelec = this.mServ.SELECCIONMODAL.subscribe((res) => {
      if (this.fun.hasValue(res)) {
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

        if (this.tipoModal === 'buscarArticulo') {
          this.renovarDataFiltros(this.tServ.obj_paginate, this.paraFiltroArticulos, this.fecha_articulo);
        } else if (this.tipoModal === 'buscarCliente') {
          this.tituloModal = 'Buscar cliente';
          this.renovarDataFiltros(this.tServ.obj_paginate, this.paraFiltroClientes, this.fecha_articulo);
        } else {
          this.tituloModal = 'Buscar suplidor';
          this.renovarDataFiltros(this.tServ.obj_paginate, this.paraFiltroSuplidor, this.fecha_articulo);
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
    if (this.subShow) this.subShow.unsubscribe();
    if (this.subTipo) this.subTipo.unsubscribe();
    if (this.subSelec) this.subSelec.unsubscribe();

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

  selectArticulosAdelantados() {
    this.returnArticulosSeleccionado = true;
    setTimeout(() => (this.returnArticulosSeleccionado = false), 250);
  }

  getDatePendiente(date) {
    const obj = { bool: true, Date: date };
    this.accion(obj);
  }

  accion(arg, tipo_?) {
    let obj = arg;

    if (tipo_) obj = { tipo: tipo_, body: arg };

    this.mServ.ModalDecision(obj);

    // setTimeout(() => this.reinicioModal(), 250);
  }

  getDevuelta(arg) {
    const obj = { dinero: arg.dinero, devuelta: arg.devuelta, forma_pago: arg.forma_pago, decision_cambio: arg.decision_cambio };
    this.devolverCLick(obj);
    this.reinicioModal();
  }

  reinicioModal() {
    this.seleccionModal = undefined;
    this.paraFiltroArticulos = undefined;
    this.paraFiltroClientes = undefined;
    this.paraFiltroSuplidor = undefined;
    this.cant_notas_credito = 0;
    this.cant_notas_debito = 0;
    this.filtrar = true;
  }

  formReporteAccion(arg) {
    const bool = arg.bool;
    const obj_ = arg.obj;

    let obj;
    obj = { data: obj_, tipo_modal: this.tipoModal };

    if (!bool) {
      obj = undefined;
      this.showModal = false;
    }

    this.mServ.ModalObj(obj);
    this.reinicioModal();
  }

  devolverCLick(arg) {
    const obj = {
      data: arg,
      tipo_modal: this.tipoModal,
    };

    if (this.tipoModal === 'buscarArticulo') obj['index'] = this.index;

    this.mServ.ModalObj(obj);
  }

  noFiltro(tipo, palabra_a_buscar) {
    this.reinicioModal();
    this.mServ.ModalNoFiltro({ tipo: tipo, index: this.index, palabra_a_buscar: palabra_a_buscar });
  }

  articuloFiltradoPorCodigo(articulo) {
    const obj = {
      data: articulo.data[0],
      index: this.index,
      tipo_modal: this.tipoModal,
    };

    this.mServ.getArticuloFiltradoPorCodigo(obj);

    this.reinicioModal();
  }

  refrescarFiltro() {
    // lo comente para que no se borre el input de la tabla que lo borre el usuario
    setTimeout(() => {
      const element = document.getElementById('search') as any;
      if (element) element.select();
    }, 100);
  }

  async renovarDataFiltros(e, buscando?, fecha_articulo?) {
    const copyData = GLOBAL.duplicarJson(this.dataFiltro);
    const page = e.page;
    const per_page = e.per_page;
    let palabra_a_buscar = ' ';

    if (buscando) palabra_a_buscar = this.fun.isEmpty(buscando) ? ' ' : buscando;
    else palabra_a_buscar = this.fun.isEmpty(e.searchText) ? ' ' : e.searchText;

    try {
      if (this.tipoModal === 'buscarArticulo') {
        const is_compra = this.metodo === 'compra' ? true : false;

        const res = await this.dbServ.getArticulosFiltrados(palabra_a_buscar, page, per_page, true, is_compra, fecha_articulo, 'todos').toPromise();

        if (res.data.length > 1) {
          this.dataFiltro = res.data;

          this.mostrarModalLuegoDeBuscarData();
          const obj = { total: res.total_registros, tabla: 'filtroArticulos' };
          this.tServ.Func_total_paginas(obj);
        } else {
          if (GLOBAL.is_number(palabra_a_buscar)) this.articuloFiltradoPorCodigo(res);
        }
      } else if (this.tipoModal === 'buscarCliente') {
        const res = await this.dbServ.getClientesFiltrados(palabra_a_buscar, page, per_page, true).toPromise();
        this.dataFiltro = undefined;

        res.data.map(async (cli) => {
          cli.nombre = GLOBAL.Capitalice(cli.nombre);
          cli.apellido = GLOBAL.Capitalice(cli.apellido);
          cli.documento_identidad = await cli.documentos_de_identidad.filter((doc) => doc.principal === true)[0].documento;
          // cli.documento_identidad = cli.documento_de_identidad ? (cli.documento_de_identidad.documento ? cli.documento_de_identidad.documento : '---------') : '---------';
          return cli;
        });

        if (res.data.length > 0) this.dataFiltro = res.data;
        if (res.data.length === 0) this.dataFiltro = copyData;

        this.mostrarModalLuegoDeBuscarData();

        const obj = {
          total: res.total_registros,
          tabla: 'filtroCliente',
        };
        this.tServ.Func_total_paginas(obj);
      } else if (this.tipoModal === 'buscarSuplidor') {
        const res = await this.dbServ.getSuplidoresFiltrados(palabra_a_buscar, page, per_page, true).toPromise();

        this.dataFiltro = undefined;

        res.data.map(async (supli) => {
          supli.nombre = GLOBAL.Capitalice(supli.nombre);
          supli.documento_identidad = await supli.documentos_de_identidad.filter((doc) => doc.principal === true)[0].documento;
          return supli;
        });

        if (res.data.length > 0) this.dataFiltro = res.data;
        if (res.data.length === 0) this.dataFiltro = copyData;
        this.mostrarModalLuegoDeBuscarData();

        const obj = {
          total: res.total_registros,
          tabla: 'filtroSuplidor',
        };
        this.tServ.Func_total_paginas(obj);
      }
      this.filtrar = true;
    } catch (error) {
      let tipo = '';

      if (this.tipoModal === 'buscarArticulo') {
        tipo = 'buscarArticulo';
        setTimeout(() => this.mServ.mostrarModal(false), 250);
      }

      if (this.tipoModal === 'buscarCliente') tipo = 'buscarCliente';

      if (this.tipoModal === 'buscarSuplidor') tipo = 'buscarSuplidor';

      this.noFiltro(tipo, palabra_a_buscar);

      this.refrescarFiltro();
    }
  }

  mostrarModalLuegoDeBuscarData() {
    setTimeout(() => (this.showModal = true), 250);
  }
}
