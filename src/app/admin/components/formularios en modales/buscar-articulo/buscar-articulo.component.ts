import { Component, OnInit } from '@angular/core';
import { GLOBAL } from '../../../../core/typescript/GLOBAL';
import { ArticuloC } from '../../../registros/articulos/articulo';
import { ModalI } from '../../new_modal/modal-class';
import { TablasService } from '../../tablas/tablas.service';
import * as _ from 'lodash';
import { FunctionService } from '../../../../core/services/functions.service';
@Component({
  selector: 'app-buscar-articulo',
  templateUrl: './buscar-articulo.component.html',
  styleUrls: ['./buscar-articulo.component.scss'],
})
export class BuscarArticuloComponent implements OnInit, ModalI {
  articuloClass = new ArticuloC();
  constructor(private tServ: TablasService, private fun: FunctionService) {}
  dataFiltro;
  modal: any = {};
  inputs: any;

  info = [
    { titulo: 'Descripción', tipo: 'text', key: 'nombre' },
    { titulo: 'Existencia', tipo: 'cantidades', key: 'cantidades' },
  ];

  btn_aceptar() {}
  ngOnInit(): void {
    this.buscarArticulos(this.tServ.obj_paginate.default, 'init');
  }

  async buscarArticulos(event, where?) {
    const copyData = this.fun.duplicarJson(this.dataFiltro);
    const page = event.page;
    const per_page = event.per_page;
    // let palabra_a_buscar = event.searchText || this.inputs.filtrarArticulo || ' ';
    let palabra_a_buscar = where == 'init' ? this.inputs.palabra_a_buscar : event.searchText || ' ';

    const is_compra = this.inputs.metodo === 'compra' ? true : false;

    const res = await this.articuloClass
      .getArticulosFiltrado({
        buscar: palabra_a_buscar,
        page: page,
        per_page: per_page,
        paginado: true,
        fecha: this.inputs.fecha_articulo,
        is_compra: is_compra,
      })
      .catch((error) => {
        this.closeThis();
      });

    this.dataFiltro = res.data;

    const obj = { total: res.total_registros, tabla: 'filtroArticulos' };
    this.tServ.Func_total_paginas(obj);
  }

  devolverCLick(dataARetornar) {
    const modal = this.closeThis();

    modal.getDataModal({ data: dataARetornar, modal_id: this.modal.component_id, index: this.inputs.index });
  }

  closeThis() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);

    return modal;
  }
}
