import { AfterViewInit, Component, Input, signal } from '@angular/core';
import { ArticuloC, ArticuloI } from '@registros/articulos/articulo';
import { TablasService } from '../../new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { default_per_page, table_config, tableCellType } from '../../new_tablas/tabla-class';
import { tipoDocFacturacion } from '@admin/facturacion/factura';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';

@Component({
  selector: 'app-buscar-articulo',
  templateUrl: './buscar-articulo.component.html',
  styleUrls: ['./buscar-articulo.component.scss'],
  standalone: false,
})
export class BuscarArticuloComponent extends MixinClass implements IDynamicModal, AfterViewInit {
  articuloClass = new ArticuloC(); 
  constructor(private tServ: TablasService) {
    super();
  }

  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() metodo: tipoDocFacturacion | null = null;
  @Input() palabra_a_buscar: string = ' ';
  @Input() fecha_articulo: string = null;
  @Input() index: number = null;

  dataFiltro = signal<ArticuloI[]>([]);

  table_config: table_config = {
    info: [
      { titulo: 'Descripción', tipo: tableCellType.text, key: 'nombre' },
      { titulo: 'Existencia', tipo: tableCellType.quantityTooltip, key: 'cantidades' },
    ],
    focusRow: true,
    id_tabla: 'buscar_articulo',
    padre_functions: { data_request: params => this.buscarArticulos(params) },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
  };

  tablaComponent;

  btn_aceptar() {}

  ngAfterViewInit(): void {
    if (this.metodo === tipoDocFacturacion.compra) this.table_config.info.push({ titulo: 'Costo', tipo: tableCellType.quantityTooltip, key: 'costo' });
    else this.table_config.info.push({ titulo: 'Precio', tipo: tableCellType.quantityTooltip, key: 'precio' });
    
    this.buscarArticulos(this.tServ.obj_paginate.default, 'init');
  }

  async buscarArticulos(params?: { per_page: number; page: number; search: string }, where?) {
    let palabra_a_buscar = where == 'init' ? this.palabra_a_buscar : params.search || ' ';

    const is_compra = this.metodo === 'compra';

    try {
      const res = await this.articuloClass.getArticulosFiltrado({
        buscar: palabra_a_buscar,
        page: params.page,
        per_page: params.per_page,
        paginado: true,
        fecha: this.fecha_articulo,
        is_compra: is_compra,
      });

      this.dataFiltro.set(res?.data);

      if (this.tablaComponent?.changeTableConfig) {
        this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
      }
    } catch (error) {
      this.modalConfig.close({ tipo: 'data_no_found', modal_id: this.modalConfig.id, index: this.index });
    }
  }

  tableClickRow(event) {
    this.modalConfig.close({ articulo: event.data, modal_id: this.modalConfig.id, index: this.index });
  }
}
