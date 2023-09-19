import { ConfigService } from './../../../../core/services/configuration.service';
import { tipoDocFacturacion } from './../../../facturacion/factura';
import { Component, OnInit } from '@angular/core';
import { ClienteC } from '../../../registros/registro-clientes/cliente';
import { ModalComponentI, ModalI } from '../../modal/modal-class';
import { TablasService } from '../../new_tablas/tablas.service';
import { SuplidorC } from '../../../registros/registro-suplidores/suplidores';
import { fun } from '../../../../core/services/functions.service';
import { table_config, table_info } from '../../new_tablas/tabla-class';
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
  modalComponent: ModalComponentI= {};
  inputs: any;
  paraFiltroClientes;

  table_config: table_config = {
    info: [],
    focusRow: true,
    id_tabla: 'buscar_cliente_suplidor',
    padre_functions: { data_request: (params) => this.buscarClientesOrSuplidor(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true,  is_local: false },
  };
  tablaComponent: any;

  ventaInfo: Array<table_info> = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
    { titulo: 'Apellido', tipo: 'text', key: 'apellido' },
    { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion' },
  ];

  compraInfo: Array<table_info> = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
    { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion' },
  ];

  btn_aceptar() {}

  ngOnInit(): void {
    this.table_config.info = this.inputs.metodo == tipoDocFacturacion.compra ? this.compraInfo : this.ventaInfo;

    this.buscarClientesOrSuplidor(this.tServ.obj_paginate.default, 'init');
  }

  async buscarClientesOrSuplidor(params?: { per_page?: number; page?: number; search?: string }, where?) {
    const copyData = fun.duplicarJson(this.dataFiltro);

    let palabra_a_buscar = where == 'init' ? this.inputs.palabra_a_buscar : params.search || ' ';

    const classDinamic = this.inputs.metodo == tipoDocFacturacion.compra ? 'suplidorClass' : 'clienteClass';
    try {
      const res = await this[classDinamic].getAll({ afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } }).catch((error) => {
        if (where === 'init') this.closeThis({ tipo: 'data_no_found', modalId: this.modalComponent.id });
      });

      if (res.data && res.data.length > 0) {
        res.data.map(async (entidad) => {
          entidad.nombre = fun.capitalice(entidad.nombre);
          entidad.apellido = fun.capitalice(entidad.apellido);
          const doc = entidad.documentos_de_identidad.find((documento) => documento.principal);

          entidad.documento_identidad = doc ? doc.documento : '----------';
          return entidad;
        });
        this.dataFiltro = res.data;
      } else {
        this.dataFiltro = copyData;
      }

      const cliente_contado = { id: null, nombre: 'Cliente contado', direccion: ConfigService.config.direccion_empresa, telefono: null };

      if (fun.objHas(this.inputs, 'include_contado') && this.inputs.include_contado) this.dataFiltro.unshift(cliente_contado);

      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    } catch (error) {}
  }

  tableClickRow(event) {
    this.closeThis({ data: event.data, modalId: this.modalComponent.id });
  }

  closeThis(dataToReturn?) {
    this.modalComponent.closeModal(this.modalComponent.id, dataToReturn);
  }
}
