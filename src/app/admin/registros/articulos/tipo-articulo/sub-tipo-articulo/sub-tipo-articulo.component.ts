import { TipoArticuloI } from './../tipo-articulo';
import { TablasService } from './../../../../components/new_tablas/tablas.service';
import { table_config } from './../../../../components/new_tablas/tabla-class';
import { Permisos } from './../../../../../core/typescript/permisos';
import { ModalI } from './../../../../components/modal/modal-class';
import { MixinClass } from './../../../../../core/typescript/MixinClass';
import { Component, OnInit } from '@angular/core';
import { SubTipoArticuloC, SubTipoArticuloI } from './sub-tipo-articulo';
import { fun } from './../../../../../core/services/functions.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgxPermissionsService } from 'ngx-permissions';

@Component({
  selector: 'app-sub-tipo-articulo',
  templateUrl: './sub-tipo-articulo.component.html',
  styleUrls: ['./sub-tipo-articulo.component.scss'],
})
export class SubTipoArticuloComponent extends MixinClass implements OnInit, ModalI {
  modal: any = {};
  inputs: { tipo_articulo: TipoArticuloI };

  listaSubTipoArticulos: SubTipoArticuloI[] = [];

  fun = fun;
  form: UntypedFormGroup;
  permissions = Permisos;
  hasPermissionsCreateUpdate: boolean;

  subCategoriaSelected: SubTipoArticuloI;
  subTipoArticuloClass = new SubTipoArticuloC();

  table_config: table_config = {
    info: [{ titulo: 'Descripcion', key: 'descripcion', tipo: 'text', style: { 'text-align': 'left', width: '80%' } }],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_sub_tipo_articulos',
    padre_functions: { data_request: (params) => this.getSubTipoArticulos(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    botones: {
      editar: { show: true, permiso: this.permissions.categoria_entidad_contable.update },
    },
  };
  tablaComponent: any;

  constructor(private permissionsService: NgxPermissionsService, private fb: UntypedFormBuilder, private tServ: TablasService) {
    super();
  }

  ngOnInit(): void {
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.getSubTipoArticulos(this.tServ.obj_paginate.default);
    await this.checkPermissions();
    await this.createForm();
  }

  getSubTipoArticulos(params?: { per_page: number; page: number; search: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    const extra = { parameters: { page: params.page, per_page: params.per_page, paginado: true, filter_target: palabra_a_buscar, tipo_articulo_id: this.inputs.tipo_articulo.id } };

    this.listaSubTipoArticulos.length = 0;
    this.subTipoArticuloClass.getAll(extra).then((res) => {
      this.listaSubTipoArticulos = fun.duplicarJson(res.data);
      this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
    });
  }

  checkPermissions() {
    this.permissionsService.hasPermission([this.permissions.sub_tipo_articulo.create, this.permissions.sub_tipo_articulo.update]).then((result) => (this.hasPermissionsCreateUpdate = result));
  }

  createForm() {
    return new Promise<any>((resolve, reject) => {
      this.form = this.fb.group({
        id: [{ value: null, disabled: false }],
        descripcion: [{ value: null, disabled: false }, Validators.required],
        tipo_articulo_id: [{ value: null, disabled: false }, Validators.required],
      });

      resolve(true);
    });
  }

  borrar() {
    this.form.reset();
    this.subCategoriaSelected = undefined;
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
  }

  editarItem(data) {
    this.form.patchValue(data);
    this.subCategoriaSelected = fun.duplicarJson(data);
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = ['id', 'descripcion'];
    const formValue = fun.pick(this.form.getRawValue(), pick_values);

    const originalValue = fun.pick(
      this.listaSubTipoArticulos.find((categoria) => categoria.id == formValue.id),
      pick_values,
    );

    return !fun.isEqual(formValue, originalValue);
  }

  formIsInvalid() {
    let res = false;

    if (!this.form.valid || !this.checkIfSomethingIsDiferrent()) {
      res = true;
    }

    return res;
  }

  requests() {
    const formulario = this.form.getRawValue();

    this.subTipoArticuloClass.createOne(formulario).then((res) => {
      this.borrar();

      const actualPagination = this.tServ.getPaginationById('listado_sub_tipo_articulos');
      this.getSubTipoArticulos(actualPagination);
    });
  }

  btn_aceptar() {}
}
