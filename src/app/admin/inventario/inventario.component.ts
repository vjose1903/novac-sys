import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { GLOBAL } from '../../core/services/GLOBAL';
import * as _ from 'lodash';
import { TablasService } from '../components/tablas/tablas.service';
import { mixinClass } from '../mixinClass';
import { LoaderService } from '../../../app/loader/loader.service';
import { ArticuloC, TipoArticuloC } from '../registros/articulos/articulo';
import { ReporteC } from '../reportes/reporte';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class InventarioComponent extends mixinClass implements OnInit, OnDestroy {
  @ViewChild('cardTabla') cardTabla: ElementRef;
  // =============================================
  //  TABLAS
  // =============================================

  info = [
    {
      titulo: 'Cod.',
      key: 'codigo',
      estilos: [{ width: '4rem' }],
    },
    {
      titulo: 'Articulo',
      key: 'nombre',
      estilos: [{ width: '35rem' }, { 'text-align': 'left' }, { 'padding-left': '2rem' }],
    },
    {
      titulo: 'Cantidad',
      key: 'cantidades',
      cantidades: true,
    },
    {
      titulo: 'Precio',
      key: 'precio_principal',
      formatoNumero: true,
    },
  ];

  cant_inventario = 0;
  botones = { titulo: true, inventario: true };
  listaArticulos;

  tipo_articulos;
  indexSelected: any;
  seleccionModal: any;
  filtrado = false;
  filtro = 'todos';

  palabra_buscar;
  fechaFactura: string;
  pdfSrc: any;
  fileName: any;

  articuloClass = new ArticuloC();
  tipoArticuloClass = new TipoArticuloC();
  reporteClass = new ReporteC();

  constructor(private tServ: TablasService, public loadServ: LoaderService) {
    super();
  }

  async ngOnInit() {
    this._init_mixin({ component: 'inventario', _lista_subs: ['decisionModal', 'printBase64Res'] });
    this.necesarioParaEmpezar();

    this.tipoArticuloClass.getAll().then((res) => (this.tipo_articulos = res));
  }

  initCambioMenu(arg) {
    if (arg.bool) this.layServ.nextDecisionCambioMenu(arg);
  }

  async printBase64Res(res) {
    if (res.status === 'si') this.fun.toastSuccess('Reporte generado correctamente!!', 'CORRECTO');
    else this.fun.toastError(res.msg, 'ERROR');
  }

  async decisionModal(arg) {
    if (this.tipoModal === 'visor_pdf') arg = { bool: arg };

    if (arg.bool) {
      if (this.tipoModal === 'visor_pdf') {
        const obj = { base64: this.seleccionModal.pdfSrc, filename: `${this.seleccionModal.fileName}.pdf` };

        this._ipc.send('printBase64', obj);
        this.resetVariables();
      } else {
        const actualPagination = this.tServ.getPaginationById('inventario');
        this.getArticulos(actualPagination);
      }
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  formatoNumero(num) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(num));
  }

  async necesarioParaEmpezar() {
    this.fechaFactura = this.formarFechaFactura(new Date())['FechaFactura'];
    await this.getArticulos(this.tServ.obj_paginate.default);
    await this.getStock();
  }

  async makeReporte() {
    const extra = { afterPath: `custom/inventario` };
    this.reporteClass.getAll(extra).then((res) => {
      const obj = { data: res, type: 'reporte' };
      this.loadServ.isLoading.next(true);
      this.generarPdf(obj);
    });
  }

  generarPdf(obj) {
    this.pdfServ.generatePdf(obj).then((res) => {
      if (res.status === 'si') {
        const obj_pdf = { pdfSrc: res.body, titulo: 'Reporte de inventario', height: '83vh', reimprimir: res.reimprimir, fileName: res.file.split('.')[0] };
        this.loadServ.isLoading.next(false);
        this.abrirModal('visor_pdf', obj_pdf);
      }
    });
  }

  async getStock() {
    const extra = { afterPath: `custom/stock` };
    this.articuloClass.getAll(extra).then((result) => (this.cant_inventario = result['data'].stock));
  }

  async getArticulos(e) {
    const page = e.page;
    const per_page = e.per_page;
    const palabra_a_buscar = e.searchText === '' || e.searchText === null || e.searchText === undefined ? ' ' : e.searchText;
    this.palabra_buscar = palabra_a_buscar;

    this.articuloClass.getArticulosFiltrado({ buscar: palabra_a_buscar, fecha: this.fechaFactura, page: page, per_page: per_page, paginado: true, is_compra: false, tipo: this.filtro }).then((res) => {
      res.data.map((arti) => {
        arti.customStyles = { 'td-codigo': { width: '4rem' }, 'td-nombre': { width: '35rem', 'text-align': 'left', 'padding-left': '2rem' } };
      });

      this.listaArticulos = GLOBAL.duplicarJson(res.data);

      const obj = { total: res.total_registros, tabla: 'inventario' };
      this.tServ.Func_total_paginas(obj);
    });
  }

  filtrarArticulos() {
    const actualPagination = this.tServ.getPaginationById('inventario');
    actualPagination['searchText'] = this.palabra_buscar;
    this.getArticulos(actualPagination);
  }

  movimientoInventario(arg) {
    this.indexSelected = arg.INDEX;
    this.abrirModal('inventario', arg.ARG);
  }

  resetVariables() {
    this.pdfSrc = undefined;
    this.fileName = undefined;
    this.tipoModal = undefined;
  }
}
