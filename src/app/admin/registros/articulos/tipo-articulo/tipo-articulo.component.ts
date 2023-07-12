import { MixinClass } from './../../../../core/typescript/MixinClass';
import { ModalI } from './../../../components/modal/modal-class';
import { Permisos } from './../../../../core/typescript/permisos';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { fun } from '../../../../core/services/functions.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { TablasService } from '../../../components/new_tablas/tablas.service';
import { TipoArticuloI, TipoArticuloC } from './tipo-articulo';
import { table_config } from '../../../components/new_tablas/tabla-class';

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
    info: [{ titulo: 'Descripcion', key: 'descripcion', tipo: 'text', style: { 'text-align': 'left', width: '80%' } }],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_tipo_articulos',
    padre_functions: { data_request: (params) => this.getTipoArticulos(params), handleBtnsDinamic: (params) => this.handleBtnsDinamic(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
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

  getTipoArticulos(params?: { per_page: number; page: number; search: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    const extra = { parameters: { page: params.page, per_page: params.per_page, paginado: true, filter_target: palabra_a_buscar } };

    this.listaTipoArticulos.length = 0;
    this.tipoArticuloClass.getAll(extra).then((res) => {
      this.listaTipoArticulos = fun.duplicarJson(res.data);

      console.log('res ', res);

      this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
    });
  }

  checkPermissions() {
    this.permissionsService.hasPermission([this.permissions.categoria_entidad_contable.create, this.permissions.categoria_entidad_contable.update]).then((result) => (this.hasPermissionsCreateUpdate = result));
  }

  createForm() {
    return new Promise<any>((resolve, reject) => {
      this.form = this.fb.group({
        id: [{ value: null, disabled: false }],
        descripcion: [{ value: null, disabled: false }, Validators.required],
        tipo: [{ value: false, disabled: false }, Validators.required],
      });

      resolve(true);
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
    console.log('params --> ', params);
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

    if (!this.form.valid || !this.checkIfSomethingIsDiferrent()) {
      res = true;
    }

    return res;
  }

  formarData() {
    let dataParsed = { categorias: [] };
    // const same_in_all_config = this.form.controls.same_in_all_config.value;
    // const formValue = fun.pick(this.form.getRawValue(), ['id', 'descripcion']);

    // if (same_in_all_config) {
    //   this.inputs.configsEntCuentas.forEach((config: ConfiguracionEntidadCuentaI) => {
    //     formValue['configuracion_entidad_cuenta_id'] = config.id;
    //     dataParsed.categorias.push(fun.duplicarJson(formValue));
    //   });
    // } else {
    //   formValue['configuracion_entidad_cuenta_id'] = this.selectedConfig.id;
    //   dataParsed.categorias.push(fun.duplicarJson(formValue));
    // }

    return dataParsed;
  }

  requests() {
    const dataToSend = this.formarData();

    // this.tipoArticuloClass.createOne(dataToSend).then((res) => {
    //   this.borrar();

    //   const actualPagination = this.tServ.getPaginationById(`listado_categorias-${this.selectedConfig.id}`);
    //   this.fillArrayWithCategorias({ ...actualPagination });
    // });
  }

  btn_aceptar() {}
}
