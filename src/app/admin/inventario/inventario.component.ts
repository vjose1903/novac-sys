import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import * as _ from 'lodash';
import { TablasService } from '../components/new_tablas/tablas.service';
import { MixinClass } from '../../core/typescript/MixinClass';
import { LoaderService } from '../../../app/loader/loader.service';
import { ArticuloC, TipoArticuloC } from '../registros/articulos/articulo';
import { ReporteC } from '../reportes/reporte';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { MovimientosFormComponent } from '../components/formularios en modales/movimientos-form/movimientos-form.component';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';
import { fun } from '../../core/services/functions.service';
import { SingletonService } from '../../core/services/singleton.service';
import { table_config } from '../components/new_tablas/tabla-class';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class InventarioComponent extends MixinClass implements OnInit, OnDestroy {
  @ViewChild('cardTabla') cardTabla: ElementRef;
  // =============================================
  //  TABLAS
  // =============================================

  table_roles_config: table_config = {
    info: [
      { titulo: 'Cod.', tipo: 'text', key: 'codigo', estilos: [{ width: '4rem' }] },
      { titulo: 'Articulo', tipo: 'text', key: 'nombre', estilos: [{ width: '35rem' }, { 'text-align': 'left' }, { 'padding-left': '2rem' }] },
      { titulo: 'Cantidad', tipo: 'cantidades', key: 'cantidades' },
      { titulo: 'Precio', tipo: 'formatoNumero', key: 'precio_principal' },
    ],
    padding: '0.5rem',
    id_tabla: 'lista_inventario',
    padre_functions: { data_request: (params) => this.getArticulos(params), handleBtnsDinamic: (params) => this.movimientoInventario(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    botones: { dinamico: [{ show: true, icon: 'fas fa-dolly', permiso: null, name: 'movimiento_inventario', tooltip: 'Movimientos de inventario' }] },
  };

  tablaComponent;

  cant_inventario = 0;
  botones = { titulo: true, inventario: true };
  listaArticulos;

  tipo_articulos;

  filtrado = false;
  filtro = 'todos';

  palabra_buscar;
  fechaFactura: string;
  pdfSrc: any;
  fileName: any;

  articuloClass = new ArticuloC();
  tipoArticuloClass = new TipoArticuloC();
  reporteClass = new ReporteC();

  constructor(private tServ: TablasService, public loadServ: LoaderService, private pdfServ: PdfService) {
    super();
  }

  async ngOnInit() {
    this._init_mixin({ component: 'inventario', is_routing: true });
    this.necesarioParaEmpezar();

    this.tipoArticuloClass.getAll().then((res) => (this.tipo_articulos = res));
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  imprimirReporteInventario(objPDFData, modalInstance?) {
    const obj = { base64: objPDFData.pdfSrc, filename: `${objPDFData.fileName}.pdf`, type: 'reporte' };
    this.pdfServ
      .imprimirBase64(obj)
      .then((res) => {
        if (res['status'] === 'si') {
          fun.toastSuccess('Reporte generado correctamente!!', 'CORRECTO');
          if (modalInstance) modalInstance.closeModal(modalInstance.id, 'reporte_inventario');
        } else fun.toastError(res['msg'], 'ERROR');
      })
      .catch((err) => {
        fun.toastError(err['msg'], 'ERROR');
      });
  }

  formatoNumero(num) {
    return fun.formatearNumero(fun.redondearAdos(num));
  }

  async necesarioParaEmpezar() {
    await this.getArticulos(this.tServ.obj_paginate.default);
    await this.getStock();
  }

  async makeReporte() {
    const extra = { afterPath: `custom/inventario` };
    this.reporteClass.getAll(extra).then((res) => {
      const obj = { data: res, type: 'reporte' };
      this.loadServ.isLoading.next(true);

      this.pdfServ.generatePdf({ oPdf: obj, imprimir: false }).then(async (res) => {
        if (res.status === 'si') {
          const obj_pdf = { pdfSrc: res.body, titulo: 'Reporte de inventario', height: '75vh', reimprimir: res.reimprimir, fileName: res.file.split('.')[0] };
          this.loadServ.isLoading.next(false);

          this.handleModalForm({
            component: PdfViewerComponent,
            inputs: obj_pdf,
            id: 'reporte_inventario',
            header: 'Reporte de inventario',
            width: '900px',
            botones: {
              aceptar: { show: false, disable: false },
              cancelar: { show: false, disable: false },
              dinamico: [
                { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancel'), label: 'Cerrar', disable: false },
                {
                  clase: 'btn btn-verde',
                  function: (instance) => {
                    this.imprimirReporteInventario(obj_pdf, instance);
                    this.resetVariables();
                  },
                  label: 'Imprimir',
                  disable: false,
                },
              ],
            },
          });
        }
      });
    });
  }

  async getStock() {
    const extra = { afterPath: `custom/stock` };
    this.articuloClass.getAll(extra).then((result) => (this.cant_inventario = result['data'].stock));
  }

  async getArticulos(params?: { per_page: number; page: number; search: string }) {


    this.fechaFactura = this.formarFechaFactura(new Date())['FechaFactura'];

    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    this.palabra_buscar = palabra_a_buscar;

    this.articuloClass.getArticulosFiltrado({ buscar: palabra_a_buscar, fecha: this.fechaFactura, page: params.page, per_page: params.per_page, paginado: true, is_compra: false, tipo: this.filtro }).then((res) => {
      res.data.map((arti) => {
        arti.customStyles = { 'td-codigo': { width: '4rem' }, 'td-nombre': { width: '35rem', 'text-align': 'left', 'padding-left': '2rem' } };
      });

      this.listaArticulos = fun.duplicarJson(res.data);
      this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
    });
  }

  filtrarArticulos() {
    const actualPagination = this.tServ.getPaginationById('lista_inventario');
    actualPagination['search'] = this.palabra_buscar;

    console.log(`this.filtro => `, this.filtro);

    if (this.filtro != 'todos') {
      if (fun.isEmpty(actualPagination['ant_page'])) {
        this.tServ.modifyPaginationById('lista_inventario', [{ ant_page: actualPagination.page }]);
        this.tServ.modifyPaginationById('lista_inventario', [{ page: 1 }]);
      }
    } else {
      if (fun.hasValue(actualPagination['ant_page'])) {
        this.tServ.modifyPaginationById('lista_inventario', [{ page: actualPagination['ant_page'] }]);
        this.tServ.modifyPaginationById('lista_inventario', [{ ant_page: null }]);
      }
    }

    fun.logRed('actualPagination ', actualPagination);
    setTimeout(() => {
      this.getArticulos(actualPagination);
      SingletonService.cdRef.detectChanges();
    }, 500);
  }

  movimientoInventario(arg) {
    console.log('arg ', arg);

    this.handleModalForm({
      component: MovimientosFormComponent,
      inputs: arg.data,
      id: 'inventario',
      header: 'Movimientos de inventario',
      width: '450px',

      botones: {
        aceptar: { show: true, disable: false },
        cancelar: { show: true, disable: false },
      },
    });
  }

  async getDataFromModal(arg, search) {
    if (arg.modal_id === 'inventario') {
      const actualPagination = this.tServ.getPaginationById('lista_inventario');
      actualPagination['search'] = this.palabra_buscar;
      this.getArticulos(actualPagination);
    }
  }

  resetVariables() {
    this.pdfSrc = undefined;
    this.fileName = undefined;
  }
}
