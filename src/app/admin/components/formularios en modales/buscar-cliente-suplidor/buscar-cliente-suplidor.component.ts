import { Component, OnInit } from '@angular/core';
import { ClienteC } from '../../../registros/registro-clientes/cliente';
import { ModalI } from '../../modal/modal-class';
import { TablasService } from '../../new_tablas/tablas.service';
import * as _ from 'lodash';
import { SuplidorC } from '../../../registros/registro-suplidores/suplidores';
import { fun } from '../../../../core/services/functions.service';
import { table_config } from '../../new_tablas/tabla-class';
import { MixinClass } from '../../../../core/typescript/MixinClass';
@Component({
  selector: 'app-buscar-cliente-suplidor',
  templateUrl: './buscar-cliente-suplidor.component.html',
  styleUrls: ['./buscar-cliente-suplidor.component.scss'],
})
export class BuscarClienteSuplidorComponent extends MixinClass implements OnInit, ModalI {
  constructor(private tServ: TablasService) {
    super();
  }

  clienteClass = new ClienteC();
  suplidorClass = new SuplidorC();
  dataFiltro;
  modal: any = {};
  inputs: any;
  paraFiltroClientes;

  table_config: table_config = {
    info: [],
    focusRow: true,
    id_tabla: 'buscar_cliente_suplidor',
    padre_functions: { data_request: (params) => this.buscarClientesOrSuplidor(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
  };
  tablaComponent: any;

  ventaInfo = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
    { titulo: 'Apellido', tipo: 'text', key: 'apellido' },
    { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion' },
  ];

  compraInfo = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
    { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion' },
  ];

  btn_aceptar() {}

  ngOnInit(): void {
    this.table_config.info = this.inputs.metodo === 'venta' ? this.ventaInfo : this.compraInfo;

    this.buscarClientesOrSuplidor(this.tServ.obj_paginate.default, 'init');
  }
  async buscarClientesOrSuplidor(params?: { per_page: number; page: number; search: string }, where?) {
    const copyData = fun.duplicarJson(this.dataFiltro);

    let palabra_a_buscar = where == 'init' ? this.inputs.palabra_a_buscar : params.search || ' ';

    const classDinamic = this.inputs.metodo === 'venta' ? 'clienteClass' : 'suplidorClass';
    try {
      const res = await this[classDinamic].getAll({ afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } }).catch((error) => {
        if (where === 'init') this.closeThis({ tipo: 'data_no_found', modal_id: this.modal.component_id });
      });

      if (res.data && res.data.length > 0) {
        res.data.map(async (entidad) => {
          entidad.nombre = fun.Capitalice(entidad.nombre);
          entidad.apellido = fun.Capitalice(entidad.apellido);
          const doc = _.find(entidad.documentos_de_identidad, { principal: true });
          entidad.documento_identidad = doc ? doc.documento : '----------';
          return entidad;
        });
        this.dataFiltro = res.data;
      } else {
        this.dataFiltro = copyData;
      }

      this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
    } catch (error) {}
  }

  tableClickRow(event) {
    const modal = this.closeThis();
    modal.getDataModal({ data: event.data, modal_id: this.modal.component_id });
  }

  closeThis(arg?) {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);
    if (arg) modal.getDataModal(arg);
    return modal;
  }
}
