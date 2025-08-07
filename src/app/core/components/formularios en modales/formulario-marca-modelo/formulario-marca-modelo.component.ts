import { HtmlElementsService } from '@core/services/html-elements.service';
import { Component, OnInit, Input, inject, signal, effect } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { TablasService } from '@components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { MarcaC, ModeloC } from '@components/formularios en modales/formulario-marca-modelo/marca-modelo';
import { fun } from '@core/services/functions.service';
import { default_per_page, table_config } from '../../new_tablas/tabla-class';
import { Permisos } from '@core/typescript/permisos';
import { NgxPermissionsService } from 'ngx-permissions';
import { confirmationButtons, IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { DynamicModalService } from '@core/components/dynamic-modal/dynamic-modal.service';

@Component({
  selector: 'app-formulario-marca-modelo',
  templateUrl: './formulario-marca-modelo.component.html',
  styleUrls: ['./formulario-marca-modelo.component.scss'],
  standalone: false,
})
export class FormularioMarcaModeloComponent extends MixinClass implements OnInit, IDynamicModal {
  @Input() modalConfig: IModalConfiguration;
  @Input() modalWrapper: DynamicModalComponent;

  @Input() tipo_formulario;

  tabIndex = signal(0);
  processingTabChange = true;

  tituloTabla;
  formMarca: UntypedFormGroup;
  formModelo: UntypedFormGroup;

  permissions = Permisos;
  table_marca_config: table_config = {
    info: [{ titulo: 'Descripcion', key: 'descripcion', tipo: 'text' }],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_marcas',
    padre_functions: { data_request: params => this.pedirNuevaData(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.marca.update }, borrar: { show: true, permiso: this.permissions.marca.destroy } },
  };
  tablaMarcaComponent: any;

  table_modelo_config: table_config = {
    info: [
      { titulo: 'Marca', key: 'marca_nombre', tipo: 'text' },
      { titulo: 'Modelo', key: 'descripcion', tipo: 'text' },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_modelos',
    padre_functions: { data_request: params => this.pedirNuevaData(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.modelo.update }, borrar: { show: true, permiso: this.permissions.modelo.destroy } },
  };

  tablaModeloComponent: any;

  info = [{ titulo: 'Descripcion', key: 'descripcion', tipo: 'text' }];

  componente = { 0: 'listado_marcas', 1: 'listado_modelos' };

  listadoMarcas = signal<any[]>([]);
  marcaSelected = signal<any>(null);

  listadoModelos = signal<any[]>([]);
  modeloSelected = signal<any>(null);

  editando = false;

  listaMarcas = signal<any[]>([]);
  listaTipoArticulos: any;

  marcasClass = new MarcaC();
  modeloClass = new ModeloC();

  hasPermissionsMarca: boolean;
  hasPermissionsModelo: boolean;
  hasPermissionsMarcaCreate: boolean;
  hasPermissionsModeloCreate: boolean;

  public htmlServ = inject(HtmlElementsService);
  public dynamicModalServ = inject(DynamicModalService);
  private fb = inject(UntypedFormBuilder);
  private tServ = inject(TablasService);
  private permissionsService = inject(NgxPermissionsService);

  constructor() {
    super();

    effect(() => {
      const tabIndex = this.tabIndex();

      if (fun.hasValue(tabIndex) && !this.processingTabChange) {
        const has_permisos = { 0: this.hasPermissionsMarca, 1: this.hasPermissionsModelo };
        this.processingTabChange = true;

        if (has_permisos[tabIndex]) {
          const actual_pagination = this.tServ.getPaginationById(this.componente[tabIndex]);
          this.pedirNuevaData(actual_pagination);
          requestAnimationFrame(() => {
            fun.enfocarInput('descripcion-input');
            console.log('ANDO AQUIII');
          });
        } else {
          fun.toastError('No tiene permisos para realizar esta acción', 'No Autorizado');

          fun.setTimeout(() => {
            const prevIndex = tabIndex == 0 ? 1 : 0;
            this.tabIndex.set(prevIndex);
          }, 1);
        }

        fun.setTimeout(() => {
          this.processingTabChange = false;
        }, 250);
      }
    });
  }

  btn_aceptar() {}

  ngOnInit() {
    this.createForm();

    if (this.tipo_formulario === 'marcas') {
      this.tabIndex.set(0);
      this.tituloTabla = 'Marcas';
    } else if (this.tipo_formulario === 'modelos') {
      this.tabIndex.set(1);
      this.tituloTabla = 'Modelos';
    }

    this.formMarca.controls.descripcion.setValidators([Validators.required]);
    this.formModelo.controls.descripcion.setValidators([Validators.required]);
    this.formModelo.controls.marca_id.setValidators([Validators.required]);

    this.getMarcas({ paginado: false, search: ' ', page: 1, per_page: 1 });

    this.pedirNuevaData(this.tServ.obj_paginate.default);

    fun.setTimeout(() => {
      this.processingTabChange = false;
      fun.enfocarInput('descripcion-input');
    }, 200);

    this.checkPermissions();
  }
  checkPermissions() {
    this.permissionsService.hasPermission(Object.values(this.permissions.marca)).then(result => (this.hasPermissionsMarca = result));
    this.permissionsService.hasPermission(Object.values(this.permissions.modelo)).then(result => (this.hasPermissionsModelo = result));

    this.permissionsService.hasPermission([this.permissions.marca.create, this.permissions.marca.update]).then(result => (this.hasPermissionsMarcaCreate = result));
    this.permissionsService.hasPermission([this.permissions.modelo.create, this.permissions.modelo.update]).then(result => (this.hasPermissionsModeloCreate = result));
  }

  getMarcas(params) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { paginado: params.paginado, page: params.page, per_page: params.per_page } };

    this.listadoMarcas.set([]);

    this.marcasClass.getAll(extra).then(res => {
      if (!params.paginado) this.listaMarcas.set(fun.deepCloning(res));

      if (params.paginado) {
        this.listadoMarcas.set(res.data);
        this.tablaMarcaComponent.changeTableConfig([{ total_count: res.total_registros }]);
      }
    });
  }

  getModelos(params) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { paginado: true, page: params.page, per_page: params.per_page } };

    this.listadoModelos.set([]);
    this.modeloClass.getAll(extra).then(res => {
      res.data.map(obj => {
        obj.marca_nombre = obj.marca.descripcion;
        return obj;
      });

      this.listadoModelos.set(res.data);
      this.tablaModeloComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  capitalice(control, arg, form) {
    const campo = form.get(control);
    campo.setValue(fun.capitalice(arg));
  }

  createForm() {
    this.formMarca = this.fb.group({ descripcion: [null], marca_id: [null], id: [null] });

    this.formModelo = this.fb.group({ descripcion: [null], marca_id: [null], id: [null] });
  }

  async pedirNuevaData(params?: { per_page?: number; page?: number; search?: string }) {
    if (this.isShowMarcas()) {
      params['paginado'] = true;
      this.getMarcas(params);
      this.getMarcas({ paginado: false, search: ' ', page: 1, per_page: 1 });
    } else {
      this.getModelos(params);
    }
  }

  closeThis() {
    this.modalConfig.close();
  }

  isShowMarcas() {
    return this.componente[this.tabIndex()] == 'listado_marcas';
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  borrar() {
    if (this.isShowMarcas()) {
      this.formMarca.reset();
      this.marcaSelected.set(null);
    } else {
      this.formModelo.reset();
      this.modeloSelected.set(null);
    }

    this.editando = false;
  }

  editarItem(data) {
    const form = this.isShowMarcas() ? this.formMarca : this.formModelo;

    if (this.isShowMarcas()) this.marcaSelected.set(data);
    else this.modeloSelected.set(data);

    this.editando = true;

    if (fun.objHas(data, 'marca')) data.marca_id = data.marca.id;

    form.patchValue(data);
  }

  eliminarReg(regisData) {
    const onYes = () => {
      const clase = this.isShowMarcas() ? this.marcasClass : this.modeloClass;
      clase.deleteOne(regisData.id).then(res => {
        const actual_pagination = this.tServ.getPaginationById(this.componente[this.tabIndex()]);
        this.pedirNuevaData(actual_pagination);
      });
    };

    this.dynamicModalServ.confirmationModal({
      id: 'eliminar_reg',
      texto: `¿Está seguro que desea eliminar ${this.isShowMarcas() ? 'la marca' : 'el modelo'}: <b> ${regisData.descripcion} </b>?`,
      btnKind: confirmationButtons.cancelarEliminar,
      onYes: onYes.bind(this),
    });
  }

  async submit(formToSubmit) {
    const formData = formToSubmit.getRawValue();
    const isUpdate = fun.hasValue(formData?.id);
    const metodo = isUpdate ? 'actualizado' : 'creado';

    // Limpiar marca_id si es formulario de marcas
    if (this.isShowMarcas() && fun.objHas(formData, 'marca_id')) {
      delete formData.marca_id;
    }

    const clase = this.isShowMarcas() ? this.marcasClass : this.modeloClass;
    await clase.createUpdateOne(formData);

    this.onSuccess(metodo);
  }

  onSuccess(metodo) {
    fun.toastSuccess(`Item ${metodo} correctamente.`, 'CORRECTO');

    // Actualizar datos y limpiar formulario
    const actual_pagination = this.tServ.getPaginationById(this.componente[this.tabIndex()]);
    this.pedirNuevaData(actual_pagination);
    this.borrar();

    // Enfocar el input correspondiente
    const inputToFocus = this.isShowMarcas() ? 'descripcion' : 'marca_modal';
    fun.enfocarInput(inputToFocus);
  }
}
