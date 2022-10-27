import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { GLOBAL } from '../../../../core/typescript/GLOBAL';
import * as _ from 'lodash';
import { TablasService } from '../../../components/new_tablas/tablas.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { MarcaC, ModeloC } from '../../../components/formularios en modales/formulario-marca-modelo/marca-modelo';
import { ModalI } from '../../modal/modal-class';
import { fun } from '../../../../core/services/functions.service';
import { table_config } from '../../new_tablas/tabla-class';
import { Permisos } from '../../../../core/typescript/permisos';
import { NgxPermissionsService } from 'ngx-permissions';

@Component({
  selector: 'app-formulario-marca-modelo',
  templateUrl: './formulario-marca-modelo.component.html',
  styleUrls: ['./formulario-marca-modelo.component.scss'],
})
export class FormularioMarcaModeloComponent extends MixinClass implements OnInit, ModalI {
  @Input() tipo_formulario;
  tabIndex;

  tituloTabla;
  @Output() accion_ = new EventEmitter<any>();
  formMarca: FormGroup;
  formModelo: FormGroup;
  permissions = Permisos;
  table_marca_config: table_config = {
    info: [{ titulo: 'Descripcion', key: 'descripcion', tipo: 'text' }],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_marcas',
    padre_functions: { data_request: (params) => this.pedirNuevaData(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
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
    padre_functions: { data_request: (params) => this.pedirNuevaData(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.modelo.update }, borrar: { show: true, permiso: this.permissions.modelo.destroy } },
  };
  tablaModeloComponent: any;

  info = [{ titulo: 'Descripcion', key: 'descripcion', tipo: 'text' }];

  botones = { titulo: true, borrar: true, editar: true };
  componente = { 0: 'listado_marcas', 1: 'listado_modelos' };

  listadoMarcas = [];
  marcaSelected;

  listadoModelos = [];
  modeloSelected;

  campo1;
  campo2;
  editando = false;

  listaMarcas: any;
  listaTipoArticulos: any;

  marcasClass = new MarcaC();
  modeloClass = new ModeloC();

  hasPermissionsMarca: boolean;
  hasPermissionsModelo: boolean;
  hasPermissionsMarcaCreate: boolean;
  hasPermissionsModeloCreate: boolean;

  constructor(private fb: FormBuilder, private tServ: TablasService, private permissionsService: NgxPermissionsService) {
    super();
  }

  modal: any = {};
  inputs: any;
  btn_aceptar() {}

  ngOnInit() {
    this.createForm();
    this.tipo_formulario = this.inputs.tipo;

    if (this.tipo_formulario === 'marcas') {
      this.tabIndex = 0;
      this.tituloTabla = 'Marcas';
      this.campo1 = 'Marca';
    } else if (this.tipo_formulario === 'modelos') {
      this.tabIndex = 1;
      this.tituloTabla = 'Modelos';
      this.campo1 = 'Marca';
    }

    this.formMarca.controls.descripcion.setValidators([Validators.required]);
    this.formModelo.controls.descripcion.setValidators([Validators.required]);
    this.formModelo.controls.marca_id.setValidators([Validators.required]);

    this.getMarcas({ paginado: false, search: ' ', page: 1, per_page: 1 });

    this.pedirNuevaData(this.tServ.obj_paginate.default);

    setTimeout(() => {
      if (this.tipo_formulario === 'modelos') fun.enfocarInput('marca_modal');
      else fun.enfocarInput('descripcion');
    }, 200);

    this.checkPermissions();
  }
  checkPermissions() {
    this.permissionsService.hasPermission(Object.values(this.permissions.marca)).then((result) => (this.hasPermissionsMarca = result));
    this.permissionsService.hasPermission(Object.values(this.permissions.modelo)).then((result) => (this.hasPermissionsModelo = result));

    this.permissionsService.hasPermission([this.permissions.marca.create, this.permissions.marca.update]).then((result) => (this.hasPermissionsMarcaCreate = result));
    this.permissionsService.hasPermission([this.permissions.modelo.create, this.permissions.modelo.update]).then((result) => (this.hasPermissionsModeloCreate = result));
  }

  getMarcas(params) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { paginado: params.paginado, page: params.page, per_page: params.per_page } };
    this.listadoMarcas.length = 0;
    this.marcasClass.getAll(extra).then((res) => {
      if (!params.paginado) this.listaMarcas = fun.duplicarJson(res);
      if (params.paginado) {
        this.listadoMarcas = res.data;
        this.tablaMarcaComponent.changeConfig([{ total_count: res.total_registros }]);
      }
    });
  }

  getModelos(params) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    const extra = { afterPath: `filtro/${palabra_a_buscar}`, parameters: { paginado: true, page: params.page, per_page: params.per_page } };

    this.listadoModelos.length = 0;
    this.modeloClass.getAll(extra).then((res) => {
      res.data.map((obj) => {
        obj.marca_nombre = obj.marca.descripcion;
        return obj;
      });

      this.listadoModelos = res.data;
      this.tablaModeloComponent.changeConfig([{ total_count: res.total_registros }]);
    });
  }

  capitalice(control, arg, form) {
    const campo = form.get(control);
    campo.setValue(fun.Capitalice(arg));
  }

  createForm() {
    this.formMarca = this.fb.group({ descripcion: [null], marca_id: [null], id: [null] });

    this.formModelo = this.fb.group({ descripcion: [null], marca_id: [null], id: [null] });
  }

  clickTabView() {
    const has_permisos = { 0: this.hasPermissionsMarca, 1: this.hasPermissionsModelo };

    if (has_permisos[this.tabIndex]) {
      const actual_pagination = this.tServ.getPaginationById(this.componente[this.tabIndex]);
      this.pedirNuevaData(actual_pagination);
    } else {
      fun.toastError('No tiene permisos para realizar esta accion', 'No Autorizado');
      setTimeout(() => (this.tabIndex = this.tabIndex == 0 ? 1 : 0), 1);
    }
  }

  async pedirNuevaData(params?: { per_page: number; page: number; search: string }) {
    if (!this.isShowMarcas()) {
      this.getModelos(params);
    } else if (this.isShowMarcas()) {
      params['paginado'] = true;
      this.getMarcas(params);
      this.getMarcas({ paginado: false, search: ' ', page: 1, per_page: 1 });
    }
  }

  accion(arg) {
    this.accion_.emit(arg);
  }

  closeThis() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);

    return modal;
  }

  async submit(formToSubmit) {
    const obj = fun.duplicarJson(formToSubmit.getRawValue());
    const metodo = fun.hasValue(obj?.id) ? 'actualizado' : 'creado';

    if (this.isShowMarcas() && _.has(obj, 'marca_id')) delete obj['marca_id'];

    const clase = this.isShowMarcas() ? this.marcasClass : this.modeloClass;

    await clase.createUpdateOne(obj).then(() => this.onSuccess(metodo));
  }

  onSuccess(metodo) {
    fun.toastSuccess(`Item ${metodo} correctamente.`, 'CORRECTO');

    this.pedirNuevaData(this.tServ.obj_paginate.default);

    this.borrar();

    if (this.isShowMarcas()) fun.enfocarInput('descripcion');
    else fun.enfocarInput('marca_modal');
  }

  isShowMarcas() {
    return this.componente[this.tabIndex] == 'listado_marcas';
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
    if (params.action == 'delete') this.eliminarReg(params.data);
  }

  borrar() {
    if (this.isShowMarcas()) {
      this.formMarca.reset();
      this.marcaSelected = undefined;
    } else {
      this.formModelo.reset();
      this.modeloSelected = undefined;
    }

    this.editando = false;
  }

  editarItem(data) {
    const form = this.isShowMarcas() ? this.formMarca : this.formModelo;

    if (this.isShowMarcas()) this.marcaSelected = data;
    else this.modeloSelected = data;

    this.editando = true;

    if (_.has(data, 'marca')) data.marca_id = data.marca.id;

    form.patchValue(data);
  }

  eliminarReg(regisData) {
    const objToSend = {
      data: regisData,
      texto: `¿Está seguro que desea eliminar ${this.isShowMarcas() ? 'la marca' : 'el modelo'}: <b> ${regisData.descripcion} </b>?`,
      siFunction: () => {
        const clase = this.isShowMarcas() ? this.marcasClass : this.modeloClass;
        clase.deleteOne(regisData.id).then((res) => {
          const actual_pagination = this.tServ.getPaginationById(this.componente[this.tabIndex]);
          this.pedirNuevaData(actual_pagination);
        });
      },
    };

    this.eliminarRegistro(objToSend);
  }
}
