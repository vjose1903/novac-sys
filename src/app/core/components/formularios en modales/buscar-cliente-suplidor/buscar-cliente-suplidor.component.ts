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
  clienteSortFields = ['id', 'nombre', 'apellido', 'telefono', 'direccion', 'limite_credito', 'maximo_credito', 'balance', 'created_at', 'updated_at'];
  suplidorSortFields = ['id', 'nombre', 'telefono', 'direccion', 'email', 'created_at', 'updated_at'];

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
    { titulo: 'Nombre', tipo: 'text', key: 'nombre', sort: { key: 'nombre', order: null } },
    { titulo: 'Apellido', tipo: 'text', key: 'apellido', sort: { key: 'apellido', order: null } },
    { titulo: 'Teléfono', tipo: 'text', key: 'telefono', sort: { key: 'telefono', order: null } },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion', sort: { key: 'direccion', order: null } },
  ];

  compraInfo: table_info[] = [
    { titulo: 'Nombre', tipo: 'text', key: 'nombre', sort: { key: 'nombre', order: null } },
    { titulo: 'Teléfono', tipo: 'text', key: 'telefono', sort: { key: 'telefono', order: null } },
    { titulo: 'Doc. identidad', tipo: 'text', key: 'documento_identidad' },
    { titulo: 'Direccion', tipo: 'text', key: 'direccion', sort: { key: 'direccion', order: null } },
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

    const palabra_a_buscar = where == 'init' ? this.palabra_a_buscar : params.search || ' ';
    const service = this.isSuplidor ? this.suplidorClass : this.clienteClass;
    const sort = this.getSortParams();

    try {
      const res = await service.getAll({ afterPath: `filtro/${palabra_a_buscar}`, parameters: { page: params.page, per_page: params.per_page, paginado: true, ...sort } });

      if (res.data && res.data.length > 0) {
        this.dataFiltro.set(this.mapEntidadesFiltro(res.data, palabra_a_buscar));
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

  getSortParams() {
    const sort = this.tServ.parseSort(this.table_config);
    if (!fun.hasValue(sort.order_by)) return {};

    const allowedFields = this.isSuplidor ? this.suplidorSortFields : this.clienteSortFields;
    const orderBy = sort.order_by
      .split(',')
      .map(item => {
        const [campo, direccion = 'asc'] = item.split(':');
        if (!allowedFields.includes(campo)) return null;
        return `${campo}:${direccion == 'desc' ? 'desc' : 'asc'}`;
      })
      .filter(item => fun.hasValue(item));

    if (!this.isSuplidor && orderBy.length == 1 && orderBy[0].startsWith('nombre:')) orderBy.push('apellido:asc');
    if (!this.isSuplidor && orderBy.length == 1 && orderBy[0].startsWith('apellido:')) orderBy.push('nombre:asc');

    return orderBy.length ? { order_by: orderBy.join(',') } : {};
  }

  mapEntidadesFiltro(data: any[], palabra_a_buscar: string) {
    const contado_name = 'Cliente contado';

    if (this.include_contado && !this.isSuplidor && contado_name.includes(palabra_a_buscar)) {
      data.unshift({ id: null, nombre: contado_name, direccion: this.configApp.direccion_empresa, telefono: null });
    }

    return data.map(entidad => {
      entidad.nombre = entidad.nombre ? fun.capitalice(entidad.nombre) : '----------';
      entidad.apellido = entidad.apellido ? fun.capitalice(entidad.apellido) : '----------';
      entidad.telefono = entidad.telefono ?? '----------';

      const doc = entidad?.documentos_de_identidad?.find(documento => documento.principal);
      entidad.documento_identidad = doc ? doc.documento : '----------';

      return entidad;
    });
  }

  tableClickRow(event) {
    if (this.after_select) event.data.after_select = this.after_select;
    this.modalConfig.close(event.data);
  }
}
