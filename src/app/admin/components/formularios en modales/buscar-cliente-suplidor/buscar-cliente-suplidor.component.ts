import { tipoDocFacturacion } from './../../../facturacion/factura';
import { Ss } from './../../../../core/services/singleton.service';
import { Component, OnInit } from '@angular/core';
import { ClienteC } from '../../../registros/registro-clientes/cliente';
import { ModalI } from '../../modal/modal-class';
import { TablasService } from '../../new_tablas/tablas.service';
import { SuplidorC } from '../../../registros/registro-suplidores/suplidores';
import { fun } from '../../../../core/services/functions.service';
import { table_config, table_info } from '../../new_tablas/tabla-class';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ConfigI } from '../../../../core/typescript/config-interface';
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
    focusSearchInput: true,
    id_tabla: 'buscar_cliente_suplidor',
    padre_functions: { data_request: (params) => this.buscarClientesOrSuplidor(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
  };
  tablaComponent: any;

  ventaInfo: table_info[] = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
    { titulo: 'Apellido', tipo: 'text', key: 'apellido' },
    { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion' },
  ];

  compraInfo: table_info[] = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
    { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion' },
  ];
  configApp!: ConfigI;
  isSuplidor: boolean = false;
  btn_aceptar() {}

  ngOnInit(): void {
    this.isSuplidor = this.inputs.metodo == tipoDocFacturacion.compra;

    this.table_config.info = this.isSuplidor ? this.compraInfo : this.ventaInfo;
    this.buscarClientesOrSuplidor(this.tServ.obj_paginate.default, 'init');

    this.configApp = Ss.configServ.getConfig({ isPromise: false });
  }

  async buscarClientesOrSuplidor(params?: { per_page: number; page: number; search: string }, where?) {
    const configApp = Ss.configServ.getConfig({ isPromise: false });
    const copyData = fun.deepCloning(this.dataFiltro);

    let palabra_a_buscar = where == 'init' ? this.inputs.palabra_a_buscar : params.search || ' ';

    const classDinamic = this.isSuplidor ? 'suplidorClass' : 'clienteClass';
    try {
      const res = await this[classDinamic].getAll({ afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } }).catch((error) => {
        if (where === 'init') this.closeThis({ tipo: 'data_no_found', modal_id: this.modal.component_id });
      });

      if (res.data && res.data.length > 0) {
        const cliente_contado = { id: null, nombre: 'Cliente contado', direccion: configApp.direccion_empresa, telefono: null };
        if (fun.objHas(this.inputs, 'include_contado') && this.inputs.include_contado && !this.isSuplidor) res.data.unshift(cliente_contado);

        res.data.map(async (entidad) => {
          entidad.nombre = entidad.nombre ? fun.Capitalice(entidad.nombre) : '----------';
          entidad.apellido = entidad.apellido ? fun.Capitalice(entidad.apellido) : '----------';
          entidad.telefono = entidad.telefono ?? '----------';

          const doc = entidad?.documentos_de_identidad?.find((documento) => documento.principal);
          entidad.documento_identidad = doc ? doc.documento : '----------';
          return entidad;
        });

        this.dataFiltro = res.data;
      } else {
        this.dataFiltro = copyData;
      }

      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    } catch (error) {}
  }

  tableClickRow(event) {
    const modal = this.closeThis();
    modal.returnDataFromModal({ data: event.data, modal_id: this.modal.component_id });
  }

  closeThis(arg?) {
    const modal = this.modal.instance.modalsConfig.find((config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);
    if (arg) modal.returnDataFromModal(arg);
    return modal;
  }
}
