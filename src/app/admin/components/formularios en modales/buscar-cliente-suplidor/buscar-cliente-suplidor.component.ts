import { Component, OnInit } from '@angular/core';
import { ClienteC } from '../../../registros/registro-clientes/cliente';
import { ModalI } from '../../modal/modal-class';
import { TablasService } from '../../tablas/tablas.service';
import * as _ from 'lodash';
import { SuplidorC } from '../../../registros/registro-suplidores/suplidores';
import { fun } from '../../../../core/services/functions.service';
@Component({
  selector: 'app-buscar-cliente-suplidor',
  templateUrl: './buscar-cliente-suplidor.component.html',
  styleUrls: ['./buscar-cliente-suplidor.component.scss'],
})
export class BuscarClienteSuplidorComponent implements OnInit, ModalI {
  clienteClass = new ClienteC();
  suplidorClass = new SuplidorC();
  dataFiltro;
  constructor(private tServ: TablasService) {}
  modal: any = {};
  inputs: any;
  paraFiltroClientes;

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
    console.log(" ----- INIT BUSCAR CLIENTE  ----- ");

    this.buscarClientesOrSuplidor(this.tServ.obj_paginate.default, 'init');
  }

  async buscarClientesOrSuplidor(event, where?) {
    const copyData = fun.duplicarJson(this.dataFiltro);
    const page = event.page;
    const per_page = event.per_page;
    let palabra_a_buscar = where == 'init' ? this.inputs.palabra_a_buscar : event.searchText || ' ';

    const classDinamic = this.inputs.metodo === 'venta' ? 'clienteClass' : 'suplidorClass';

    const res = await this[classDinamic].getAll({ afterPath: `filtro/${palabra_a_buscar}`, parameters: { page, per_page, paginado: true } }).catch((error) => {
      if (where === 'init') this.closeThis();
    });

    console.log(' ');
    console.log('res ', res);
    console.log(' ');

    if (res.data && res.data.length > 0) {
      res.data.map(async (cli) => {
        cli.nombre = fun.Capitalice(cli.nombre);
        cli.apellido = fun.Capitalice(cli.apellido);

        const documento = await cli.documentos_de_identidad.find((doc) => doc.principal === true);
        cli.documento_identidad = documento ? documento.documento : '----------';
        return cli;
      });
      this.dataFiltro = res.data;
    } else {
      this.dataFiltro = copyData;
    }

    const obj = { total: res.total_registros, tabla: 'filtroCliente' };
    this.tServ.Func_total_paginas(obj);
  }
  devolverCLick(dataARetornar) {
    const modal = this.closeThis();

    modal.getDataModal({ data: dataARetornar, modal_id: this.modal.component_id });
  }

  closeThis() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);

    return modal;
  }
}
