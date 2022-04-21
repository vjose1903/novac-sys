import { Component, OnInit, Input, OnChanges, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalService } from './modal.service';
import { TablasService } from '../tablas/tablas.service';
import { ArticuloC } from '../../registros/articulos/articulo';
import { SuplidorC } from '../../registros/registro-suplidores/suplidores';
import { ClienteC } from '../../registros/registro-clientes/cliente';
import { fun } from '../../../core/services/functions.service';

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
  articuloClass = new ArticuloC();
  suplidorClass = new SuplidorC();
  clienteClass = new ClienteC();
  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    if (this.showModal) {
      this.showModal = false;
      const obj = { total: 0, tabla: 'tabla' };

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
    { titulo: 'Descripción', tipo: 'text', key: 'nombre' },
    { titulo: 'Existencia', tipo: 'cantidades', key: 'cantidades', cantidades: true },
  ];

  paraFiltroArticulos;
  metodo;
  infoCliente = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
    { titulo: 'Apellido', tipo: 'text', key: 'apellido' },
    { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion' },
  ];

  infoSuplidor = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
    { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion' },
  ];
  constructor(public mServ: ModalService, private tServ: TablasService) {}

  element: HTMLElement;
  subShow: Subscription;
  subTipo: Subscription;
  subSelec: Subscription;
  // subCalcularHeigth: Subscription;

  ngOnInit() {
    this.subShow = this.mServ.SHOWMODAL.subscribe((res) => {
      if (fun.hasValue(res)) {
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
      if (fun.hasValue(res)) {
        this.tipoModal = res;
      }
    });

    this.subSelec = this.mServ.SELECCIONMODAL.subscribe((res) => {
      if (fun.hasValue(res)) {
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
          this.renovarDataFiltros(this.tServ.getPaginationByModal(), this.paraFiltroArticulos, this.fecha_articulo);
        } else if (this.tipoModal === 'buscarCliente') {
          this.tituloModal = 'Buscar cliente';

          this.renovarDataFiltros(this.tServ.getPaginationByModal(), this.paraFiltroClientes, this.fecha_articulo);
        } else {
          this.tituloModal = 'Buscar suplidor';
          this.renovarDataFiltros(this.tServ.getPaginationByModal(), this.paraFiltroSuplidor, this.fecha_articulo);
        }

        if (this.tipoModal === 'mostrarFactura' && res) {
          this.mostrar_para = res.mostrarFacturaPara;

          if (this.seleccionModal.tiene_nota && this.seleccionModal.notas.length > 0) {
            // TODO: usar reduce aqui
            for (let i = 0; i < this.seleccionModal.notas.length; i++) {
              const nota = this.seleccionModal.notas[i];
              if (nota.tipo_factura_id === 5) this.cant_notas_credito++;
              if (nota.tipo_factura_id === 4) this.cant_notas_debito++;
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
    const copyData = fun.duplicarJson(this.dataFiltro);
    if (fun.isEmpty(e)) e = this.tServ.obj_paginate.default;

    const page = e.page;
    const per_page = e.per_page;
    let palabra_a_buscar = ' ';

    if (buscando) palabra_a_buscar = fun.isEmpty(buscando) ? ' ' : buscando;
    else palabra_a_buscar = fun.isEmpty(e.searchText) ? ' ' : e.searchText;

    try {
      if (this.tipoModal === 'buscarArticulo') {
        const is_compra = this.metodo === 'compra' ? true : false;

        const res = await this.articuloClass.getArticulosFiltrado({ buscar: palabra_a_buscar, page: page, per_page: per_page, paginado: true, fecha: fecha_articulo, is_compra: is_compra });

        if (fun.is_number(palabra_a_buscar) && res.data.length === 1) {
          this.articuloFiltradoPorCodigo(res);
        } else {
          this.dataFiltro = res.data;
          this.mostrarModalLuegoDeBuscarData();
          const obj = { total: res.total_registros, tabla: 'filtroArticulos' };
          this.tServ.Func_total_paginas(obj);
        }
        //
      } else if (this.tipoModal === 'buscarCliente') {
        const res = await this.clienteClass.getAll({ afterPath: `filtro/${palabra_a_buscar}`, parameters: { page, per_page, paginado: true } });

        this.dataFiltro = undefined;

        res.data.map(async (cli) => {
          cli.nombre = fun.Capitalice(cli.nombre);
          cli.apellido = fun.Capitalice(cli.apellido);

          const documento = await cli.documentos_de_identidad.find((doc) => doc.principal === true);
          cli.documento_identidad = documento ? documento.documento : '----------';
          return cli;
        });

        if (res.data.length > 0) this.dataFiltro = res.data;
        if (res.data.length === 0) this.dataFiltro = copyData;

        this.mostrarModalLuegoDeBuscarData();

        const obj = { total: res.total_registros, tabla: 'filtroCliente' };
        this.tServ.Func_total_paginas(obj);
      } else if (this.tipoModal === 'buscarSuplidor') {
        const res = await this.suplidorClass.getAll({ afterPath: `filtro/${palabra_a_buscar}`, parameters: { page, per_page, paginado: true } });

        this.dataFiltro = undefined;

        res.data.map(async (supli) => {
          supli.nombre = fun.Capitalice(supli.nombre);
          const documento = await supli.documentos_de_identidad.find((doc) => doc.principal === true);
          supli.documento_identidad = documento ? documento.documento : '----------';

          return supli;
        });

        if (res.data.length > 0) this.dataFiltro = res.data;
        if (res.data.length === 0) this.dataFiltro = copyData;
        this.mostrarModalLuegoDeBuscarData();

        const obj = { total: res.total_registros, tabla: 'filtroSuplidor' };
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
