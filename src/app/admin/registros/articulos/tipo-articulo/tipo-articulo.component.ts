import { MixinClass } from './../../../../core/typescript/MixinClass';
import { ModalClass, ModalI } from './../../../components/modal/modal-class';
import { Permisos } from './../../../../core/typescript/permisos';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { fun } from '../../../../core/services/functions.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { TablasService } from '../../../components/new_tablas/tablas.service';
import { TipoArticuloI, TipoArticuloC } from './tipo-articulo';
import { table_config } from '../../../components/new_tablas/tabla-class';
import { SubTipoArticuloComponent } from './sub-tipo-articulo/sub-tipo-articulo.component';

@Component({
  selector: 'app-tipo-articulo',
  templateUrl: './tipo-articulo.component.html',
  styleUrls: ['./tipo-articulo.component.scss'],
})
export class TipoArticuloComponent extends MixinClass implements OnInit, ModalI {
  modal: any = {};
  inputs;

  listaTipoArticulos: TipoArticuloI[] = [];

  fun = fun;
  form: UntypedFormGroup;
  permissions = Permisos;
  hasPermissionsCreateUpdate: boolean;

  categoriaSelected: TipoArticuloI;
  tipoArticuloClass = new TipoArticuloC();
  tiposDeCategoria = TipoArticuloC.tipos;

  table_config: table_config = {
    info: [
      { titulo: 'Descripcion', key: 'descripcion', tipo: 'text', style: { 'text-align': 'left', width: '55%' } },
      { titulo: 'Tipo', key: 'tipo_', tipo: 'text', style: { 'text-align': 'left', width: '25%' } },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_tipo_articulos',
    padre_functions: { data_request: (params) => this.getTipoArticulos(params), handleBtnsDinamic: (params) => this.handleBtnsDinamic(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true,  is_local: false },
    botones: {
      editar: { show: true, permiso: this.permissions.categoria_entidad_contable.update },
      dinamico: [{ show: true, icon: 'fa-solid fa-diagram-next', permiso: Object.values(this.permissions.sub_tipo_articulo), name: 'subTipoArticulo', tooltip: 'Sub Categorias' }],
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
    await this.getTipoArticulos(this.tServ.obj_paginate.default);
    await this.checkPermissions();
    await this.createForm();
  }

  getTipoArticulos(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    const extra = { parameters: { page: params.page, per_page: params.per_page, paginado: true, filter_target: palabra_a_buscar } };

    this.listaTipoArticulos.length = 0;
    this.tipoArticuloClass.getAll(extra).then((res) => {
      res.data.map((tipo_articulo) => {
        tipo_articulo.tipo_ = this.tiposDeCategoria.find((tipo) => tipo.key == tipo_articulo.tipo).label;
        return tipo_articulo;
      });

      this.listaTipoArticulos = fun.duplicarJson(res.data);

      console.log('res ', res);

      this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
    });
  }

  checkPermissions() {
    this.permissionsService.hasPermission([this.permissions.tipo_articulo.create, this.permissions.tipo_articulo.update]).then((result) => (this.hasPermissionsCreateUpdate = result));
  }

  createForm() {
    return new Promise<any>((resolve, reject) => {
      this.form = this.fb.group({
        id: [{ value: null, disabled: false }],
        descripcion: [{ value: null, disabled: false }, Validators.required],
        tipo: [{ value: null, disabled: false }, Validators.required],
      });

      resolve(true);
    });
  }

  openModalSubCategorias(data) {
    const header = `Sub Categorias de tipo articulo: ${data.descripcion}`;
    const inputs = { tipo_articulo: data };

    this.openNewModal({
      component: SubTipoArticuloComponent,
      inputs: inputs,
      id: 'sub-categoria-articulos',
      header: header,
      width: '70rem',
      botones: {
        ...fun.duplicarJson(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.dismissModal(instance.id), label: 'Cerrar', disable: false }],
      },
    });
  }

  borrar() {
    this.form.reset();
    this.categoriaSelected = undefined;
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
  }

  handleBtnsDinamic(params) {
    if (params.id_tabla == 'listado_tipo_articulos' && params.name == 'subTipoArticulo') this.openModalSubCategorias(params.data);
  }

  editarItem(data) {
    this.form.patchValue(data);
    this.categoriaSelected = fun.duplicarJson(data);
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = ['id', 'descripcion'];
    const formValue = fun.pick(this.form.getRawValue(), pick_values);

    const originalValue = fun.pick(
      this.listaTipoArticulos.find((categoria) => categoria.id == formValue.id),
      pick_values,
    );

    return !fun.isEqual(formValue, originalValue);
  }

  formIsInvalid() {
    let res = false;

    if (!this.form.valid || (this.categoriaSelected && !this.checkIfSomethingIsDiferrent())) {
      res = true;
    }

    return res;
  }

  requests() {
    const formulario = this.form.getRawValue();

    this.tipoArticuloClass.createOne(formulario).then((res) => {
      this.borrar();

      const actualPagination = this.tServ.getPaginationById('listado_tipo_articulos');
      this.getTipoArticulos(actualPagination);
    });
  }

  btn_aceptar() {}
}
