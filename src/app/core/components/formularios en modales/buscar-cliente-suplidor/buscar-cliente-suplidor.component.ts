import { tipoDocFacturacion } from '@admin/facturacion/factura';
import { Ss } from '@core/services/singleton.service';
import { Component, Input, OnInit, signal } from '@angular/core';
import { ClienteC } from '@registros/registro-clientes/cliente';
import { TablasService } from '../../new_tablas/tablas.service';
import { SuplidorC } from '@registros/registro-suplidores/suplidores';
import { fun } from '@core/services/functions.service';
import { default_per_page, table_config, table_info } from '../../new_tablas/tabla-class';
import { MixinClass } from '@core/typescript/MixinClass';
import { ConfigI } from '@core/interface/config-interface';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
@Component({
  selector: 'app-buscar-cliente-suplidor',
  templateUrl: './buscar-cliente-suplidor.component.html',
  styleUrls: ['./buscar-cliente-suplidor.component.scss'],
  standalone: false,
})
export class BuscarClienteSuplidorComponent extends MixinClass implements OnInit, IDynamicModal {
  constructor(private tServ: TablasService) {
    super();
  }

  clienteClass = new ClienteC();
  suplidorClass = new SuplidorC();
  dataFiltro = signal<any[]>([]);

  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;

  @Input() metodo: tipoDocFacturacion | null = null;
  @Input() include_contado: boolean = false;
  @Input() palabra_a_buscar: string = ' ';
  @Input() after_select: any = null;

  paraFiltroClientes;

  table_config: table_config = {
    info: [],
    focusRow: true,
    focusSearchInput: false,
    id_tabla: 'buscar_cliente_suplidor',
    padre_functions: { data_request: params => this.buscarClientesOrSuplidor(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
  };
  tablaComponent: any;

  ventaInfo: table_info[] = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
    { titulo: 'Apellido', tipo: 'text', key: 'apellido' },
    { titulo: 'Teléfono', tipo: 'text', key: 'telefono' },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion' },
  ];

  compraInfo: table_info[] = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre' },
    { titulo: 'Teléfono', tipo: 'text', key: 'telefono' },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion' },
  ];
  configApp!: ConfigI;
  isSuplidor: boolean = false;
  btn_aceptar() {}

  ngOnInit(): void {
    this.isSuplidor = this.metodo == tipoDocFacturacion.compra;
    this.configApp = Ss.configServ.config;

    this.table_config.info = this.isSuplidor ? this.compraInfo : this.ventaInfo;
    this.buscarClientesOrSuplidor(this.tServ.obj_paginate.default, 'init');
  }

  async buscarClientesOrSuplidor(params?: { per_page: number; page: number; search: string }, where?) {
    params = params ?? this.tServ.obj_paginate.default;

    let palabra_a_buscar = where == 'init' ? this.palabra_a_buscar : params.search || ' ';

    const classDinamic = this.isSuplidor ? 'suplidorClass' : 'clienteClass';
    try {
      const res = await this[classDinamic].getAll({ afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true } });

      if (res.data && res.data.length > 0) {
        const contado_name = 'Cliente contado';
        const cliente_contado = { id: null, nombre: contado_name, direccion: this.configApp.direccion_empresa, telefono: null };
        const busqueda_include_contado = contado_name.includes(palabra_a_buscar);

        if (this.include_contado && !this.isSuplidor && busqueda_include_contado) res.data.unshift(cliente_contado);

        res.data.map(async entidad => {
          entidad.nombre = entidad.nombre ? fun.capitalice(entidad.nombre) : '----------';
          entidad.apellido = entidad.apellido ? fun.capitalice(entidad.apellido) : '----------';
          entidad.telefono = entidad.telefono ?? '----------';

          const doc = entidad?.documentos_de_identidad?.find(documento => documento.principal);
          entidad.documento_identidad = doc ? doc.documento : '----------';
          return entidad;
        });

        this.dataFiltro.set(res.data);
      } else {
        this.dataFiltro.set([]);
      }

      if (this.tablaComponent) {
        this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
      } else {
        window.setTimeout(() => this.tablaComponent?.changeTableConfig([{ total_count: res.total_registros }]), 50);
      }
    } catch (error) {
      this.dataFiltro.set([]);
      if (where === 'init') {
        this.modalConfig.close({ tipo: 'data_no_found', modal_id: this.modalConfig.id });
      } else {
        fun.toastError('No se pudo realizar la búsqueda', 'ERROR');
      }
    }
  }

  tableClickRow(event) {
    if (this.after_select) event.data.after_select = this.after_select;
    this.modalConfig.close(event.data);
  }
}
