import { Component, OnInit } from '@angular/core';
import { ArticuloC } from '../../../registros/articulos/articulo';
import { IModalConfiguration, ModalI } from '../../modal/modal-class';
import { TablasService } from '../../new_tablas/tablas.service';

import { MixinClass } from '../../../../core/typescript/MixinClass';
import { table_config } from '../../new_tablas/tabla-class';

@Component({
  selector: 'app-buscar-articulo',
  templateUrl: './buscar-articulo.component.html',
  styleUrls: ['./buscar-articulo.component.scss'],
})
export class BuscarArticuloComponent extends MixinClass implements OnInit, ModalI {
  articuloClass = new ArticuloC();
  constructor(private tServ: TablasService) {
    super();
  }

  dataFiltro;
  modal: any = {};
  inputs: any;

  table_config: table_config = {
    info: [
      { titulo: 'Descripción', tipo: 'text', key: 'nombre' },
      { titulo: 'Existencia', tipo: 'cantidades', key: 'cantidades' },
    ],
    focusRow: true,
    id_tabla: 'buscar_articulo',
    padre_functions: { data_request: (params) => this.buscarArticulos(params) },
    obj_paginate: { show: true, showTotal: true,  is_local: false },
  };

  tablaComponent;

  btn_aceptar() {}
  ngOnInit(): void {
    this.buscarArticulos(this.tServ.obj_paginate.default, 'init');
  }

  async buscarArticulos(params?: { per_page?: number; page?: number; search?: string }, where?) {
    let palabra_a_buscar = where == 'init' ? this.inputs.palabra_a_buscar : params.search || ' ';

    const is_compra = this.inputs.metodo === 'compra';

    try {
      const res = await this.articuloClass
        .getArticulosFiltrado({
          buscar: palabra_a_buscar,
          page: params.page,
          per_page: params.per_page,
          paginado: true,
          fecha: this.inputs.fecha_articulo,
          is_compra: is_compra,
        })
        .catch((error) => {
          this.closeThis({ tipo: 'data_no_found', modalId: this.modal.component_id, index: this.inputs.index });
        });

      this.dataFiltro = res?.data;
      this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
    } catch (error) {}
  }

  tableClickRow(event) {
    this.closeThis({ data: event.data, modalId: this.modal.component_id, index: this.inputs.index });
  }

  closeThis(dataToReturn?) {
    this.modal.instance.resetConfig(this.modal.component_id, dataToReturn);
  }
}
