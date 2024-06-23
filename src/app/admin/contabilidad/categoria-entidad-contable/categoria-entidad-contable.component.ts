import { HtmlElementsService } from './../../../core/services/html-elements.service';
import { TablasService } from './../../components/new_tablas/tablas.service';
import { fun } from './../../../core/services/functions.service';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { Component, OnInit, inject } from '@angular/core';
import { ModalComponentI, ModalI } from '../../components/modal/modal-class';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from '../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { NgxPermissionsService } from 'ngx-permissions';
import { Permisos } from '../../../core/typescript/permisos';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CategoriaEntidadContableC, CategoriaEntidadContableI, entidadesContables } from './categoria-entidad-contable.utils';
import { paginateI, tableCellType, table_config } from '../../components/new_tablas/tabla-class';
import * as _ from 'lodash';
import { CategoriaEntidadContableService } from './categoria-entidad-contable.service';

@Component({
  selector: 'app-categoria-entidad-contable',
  templateUrl: './categoria-entidad-contable.component.html',
  styleUrls: ['./categoria-entidad-contable.component.scss'],
})
export class CategoriaEntidadContableComponent extends MixinClass implements OnInit, ModalI {
  fun = fun;
  form: UntypedFormGroup;
  permissions = Permisos;
  hasPermissionsCreateUpdate;

  modalComponent: ModalComponentI = {};
  inputs: { configsEntCuentas: Array<ConfiguracionEntidadCuentaI>; entidad: entidadesContables };

  tabIndex = 0;
  configEntContableClass = new ConfiguracionEntidadCuentaC();
  selectedConfig: ConfiguracionEntidadCuentaI;

  table_config: table_config = {
    info: [{ titulo: 'Descripcion', key: 'descripcion', tipo: tableCellType.text, estilos: [{ 'text-align': 'left' }, { width: '80%' }] }],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_categorias',
    padre_functions: { data_request: (params) => this.fillArrayWithCategorias({ ...params }) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.categoria_entidad_contable.update } },
  };
  tablaComponent: any;

  categoriaSelected: CategoriaEntidadContableI;
  listadoCategorias: Array<CategoriaEntidadContableI> = [];

  categoriaEntContClass = new CategoriaEntidadContableC();

  htmlServ = inject(HtmlElementsService);

  constructor(private permissionsService: NgxPermissionsService, private fb: UntypedFormBuilder, private tServ: TablasService) {
    super();
  }

  ngOnInit(): void {
    this.checkPermissions();
    this.createForm();
    this.selectCurrentConfig();
    this.fillArrayWithCategorias({ ...this.tServ.obj_paginate.default });
  }

  createForm() {
    return new Promise<any>((resolve, reject) => {
      this.form = this.fb.group({
        id: [{ value: null, disabled: false }],
        descripcion: [{ value: null, disabled: false }, Validators.required],
        same_in_all_config: [{ value: false, disabled: false }],
      });

      resolve(true);
    });
  }

  checkPermissions() {
    this.permissionsService.hasPermission([this.permissions.categoria_entidad_contable.create, this.permissions.categoria_entidad_contable.update]).then((result) => (this.hasPermissionsCreateUpdate = result));
  }

  changeTabIndex(event) {
    this.selectCurrentConfig();
    this.fillArrayWithCategorias({ ...this.tServ.obj_paginate.default });
  }

  selectCurrentConfig() {
    this.selectedConfig = this.inputs.configsEntCuentas[this.tabIndex];
  }

  borrar() {
    this.form.reset();
    this.categoriaSelected = undefined;
  }

  formIsInvalid() {
    let res = false;

    if (!this.form.valid || !this.checkIfSomethingIsDiferrent()) {
      res = true;
    }

    return res;
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = ['id', 'descripcion'];
    const formValue = fun.pick(this.form.getRawValue(), pick_values);

    const originalValue = fun.pick(
      this.listadoCategorias.find((categoria) => categoria.id == formValue.id),
      pick_values,
    );

    return !fun.isEqual(formValue, originalValue);
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
  }

  fillArrayWithCategorias(paginationOptions: paginateI) {
    this.listadoCategorias.length = 0;
    CategoriaEntidadContableService.getCategoriasByEntidad({ ...paginationOptions, config_id: this.selectedConfig.id, entidad: this.inputs.entidad }).then((res) => {
      this.listadoCategorias = res['data'];
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  editarItem(data) {
    this.form.patchValue(data);
    this.categoriaSelected = fun.deepCloning(data);
    this.form.controls.same_in_all_config.setValue(false);
  }

  formarData() {
    let dataParsed = { categorias: [] };
    const same_in_all_config = this.form.controls.same_in_all_config.value;
    const formValue = fun.pick(this.form.getRawValue(), ['id', 'descripcion']);

    if (same_in_all_config) {
      this.inputs.configsEntCuentas.forEach((config: ConfiguracionEntidadCuentaI) => {
        formValue['configuracion_entidad_cuenta_id'] = config.id;
        dataParsed.categorias.push(fun.deepCloning(formValue));
      });
    } else {
      formValue['configuracion_entidad_cuenta_id'] = this.selectedConfig.id;
      dataParsed.categorias.push(fun.deepCloning(formValue));
    }

    return dataParsed;
  }

  requests() {
    const dataToSend = this.formarData();

    this.categoriaEntContClass.createOne(dataToSend).then((res) => {
      this.borrar();

      const actualPagination = this.tServ.getPaginationById(`listado_categorias-${this.selectedConfig.id}`);
      this.fillArrayWithCategorias({ ...actualPagination });
    });
  }

  btn_aceptar() {}
}
