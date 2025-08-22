import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { LoaderService } from '../../../app/loader/loader.service';
import { ArticuloC, TipoArticuloC } from '@registros/articulos/articulo';
import { ReporteC } from '../reportes/reporte';
import { MovimientosFormComponent } from '@components/formularios en modales/movimientos-form/movimientos-form.component';
import { fun } from '@core/services/functions.service';
import { default_per_page, table_config, tableCellType } from '@components/new_tablas/tabla-class';
import { Permisos } from '@core/typescript/permisos';
import { InventarioC } from './inventario';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { ICallbackModal, modalActionsE, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
  standalone: false,
})
export class InventarioComponent extends MixinClass implements OnInit, OnDestroy {
  @ViewChild('cardTabla') cardTabla: ElementRef;
  // =============================================
  //  TABLAS
  // =============================================
  permissions = Permisos;
  table_roles_config: table_config = {
    info: [
      { titulo: 'Cod.', tipo: tableCellType.text, key: 'codigo', style: { width: '5.5rem', 'text-align': 'left' } },
      { titulo: 'Articulo', tipo: tableCellType.text, key: 'nombre', style: { width: '30rem', 'text-align': 'left' } },
      { titulo: 'Cantidad', tipo: tableCellType.quantityTooltip, key: 'cantidades' },
      { titulo: 'Precio', tipo: tableCellType.formatoNumero, key: 'precio_principal' },
      { titulo: 'Costo', tipo: tableCellType.formatoNumero, key: 'costo_principal' },
    ],
    padding: '0.5rem',
    id_tabla: 'lista_inventario',
    padre_functions: { data_request: params => this.getArticulos(params), handleBtnsDinamic: params => this.movimientoInventario(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    botones: { dinamico: [{ show: true, icon: 'fas fa-dolly', permiso: this.permissions.movimiento_inventario.create, name: 'movimiento_inventario', tooltip: 'Movimientos de inventario' }] },
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

  articuloClass = new ArticuloC();
  tipoArticuloClass = new TipoArticuloC();
  reporteClass = new ReporteC();

  constructor(
    private tServ: TablasService,
    public loadServ: LoaderService
  ) {
    super();
  }

  async ngOnInit() {
    this._init_mixin({ component: 'inventario', is_routing: true });
    this.necesarioParaEmpezar();

    this.tipoArticuloClass.getAll().then(res => (this.tipo_articulos = res.data));
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  formatoNumero(num) {
    return fun.roundNumberToDecimal(num);
  }

  async necesarioParaEmpezar() {
    await this.getArticulos(this.tServ.obj_paginate.default);
    await this.getStock();
  }

  async makeReporte() {
    InventarioC.openModalReporteForm({ tipo: 'inventario', titulo: 'Reporte de inventario' });
  }

  async getStock() {
    const extra = { afterPath: `custom/stock` };
    this.articuloClass.getAll(extra).then((result: any) => (this.cant_inventario = result['data'].stock));
  }

  async getArticulos(params?: { per_page?: number; page?: number; search?: string }) {
    this.fechaFactura = this.formarFechaFactura(new Date())['FechaFactura'];

    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    this.palabra_buscar = palabra_a_buscar;

    this.articuloClass.getArticulosFiltrado({ buscar: palabra_a_buscar, fecha: this.fechaFactura, page: params.page, per_page: params.per_page, paginado: true, is_compra: false, tipo: this.filtro }).then(res => {
      this.listaArticulos = fun.deepCloning(res.data);
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  filtrarArticulos() {
    const actualPagination = this.tServ.getPaginationById('lista_inventario');
    actualPagination['search'] = this.palabra_buscar;

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

    fun.setTimeout(() => this.getArticulos(actualPagination), 500);
  }

  movimientoInventario(arg) {
    const tipoArticuloSelected = this.tipo_articulos.find(val => val.id == Number(arg.data.tipo_articulo_id));

    if (tipoArticuloSelected.tipo != 'servicio') {
      const modalConfig = new DynamicModalClass();
      modalConfig.width = '30rem';
      modalConfig.component = MovimientosFormComponent;
      modalConfig.inputs = { data: arg.data };
      modalConfig.id = 'inventarioModal';
      modalConfig.header = 'Movimientos de inventario';

      modalConfig.botones = [
        { clase: 'btn btn-gris', action: modalActionsE.close, label: 'Cerrar', disable: false },
        { id: 'btn_aceptar', clase: 'btn btn-green', label: 'Aceptar', disable: false },
      ];

      modalConfig.setCallback((arg: ICallbackModal) => this.movimientoInventarioCallback(arg));
      modalConfig.show();
    } else {
      fun.toastWarning('El articulo seleccionado no requiere movimientos de inventario', 'AVISO');
    }
  }

  movimientoInventarioCallback(arg: ICallbackModal) {
    if (arg.type != modalCloseType.returnData) return;

    const actualPagination = this.tServ.getPaginationById('lista_inventario');
    actualPagination['search'] = this.palabra_buscar;
    this.getArticulos(actualPagination);
  }
}
