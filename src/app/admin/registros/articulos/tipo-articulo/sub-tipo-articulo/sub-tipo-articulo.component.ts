import { HtmlElementsService } from '@core/services/html-elements.service';
import { TipoArticuloI } from './../tipo-articulo';
import { TablasService } from '@components/new_tablas/tablas.service';
import { tableCellType, table_config } from '@components/new_tablas/tabla-class';
import { Permisos } from '@core/typescript/permisos';
import { MixinClass } from '@core/typescript/MixinClass';
import { Component, Input, OnInit, inject } from '@angular/core';
import { SubTipoArticuloC, SubTipoArticuloI } from './sub-tipo-articulo';
import { fun } from '@core/services/functions.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgxPermissionsService } from 'ngx-permissions';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';

@Component({
  selector: 'app-sub-tipo-articulo',
  templateUrl: './sub-tipo-articulo.component.html',
  styleUrls: ['./sub-tipo-articulo.component.scss'],
  standalone: false,
})
export class SubTipoArticuloComponent extends MixinClass implements OnInit, IDynamicModal {
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() modalConfig!: IModalConfiguration;
  @Input() tipo_articulo: TipoArticuloI;

  listaSubTipoArticulos: SubTipoArticuloI[] = [];

  fun = fun;
  form: UntypedFormGroup;
  permissions = Permisos;
  hasPermissionsCreateUpdate: boolean;

  subCategoriaSelected: SubTipoArticuloI;
  subTipoArticuloClass = new SubTipoArticuloC();

  table_config: table_config = {
    info: [{ titulo: 'Descripcion', key: 'descripcion', tipo: tableCellType.text, style: { 'text-align': 'left', width: '80%' } }],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'listado_sub_tipo_articulos',
    padre_functions: { data_request: params => this.getSubTipoArticulos(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, is_local: false },
    botones: {
      editar: { show: true, permiso: this.permissions.categoria_entidad_contable.update },
    },
  };
  tablaComponent: any;

  htmlServ = inject(HtmlElementsService);

  constructor(
    private permissionsService: NgxPermissionsService,
    private fb: UntypedFormBuilder,
    private tServ: TablasService
  ) {
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

  getSubTipoArticulos(params?: { per_page?: number; page?: number; search?: string }) {
    const parameters = { ...params, paginado: true, tipo_articulo_id: this.tipo_articulo.id };
    this.listaSubTipoArticulos.length = 0;

    this.subTipoArticuloClass.getSubTipoArticulos(parameters).then(res => {
      this.listaSubTipoArticulos = fun.deepCloning(res.data);
      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  checkPermissions() {
    this.permissionsService.hasPermission([this.permissions.sub_tipo_articulo.create, this.permissions.sub_tipo_articulo.update]).then(result => (this.hasPermissionsCreateUpdate = result));
  }

  createForm() {
    return new Promise<any>((resolve, reject) => {
      this.form = this.fb.group({
        id: [{ value: null, disabled: false }],
        descripcion: [{ value: null, disabled: false }, Validators.required],
        tipo_articulo_id: [{ value: this.tipo_articulo.id, disabled: false }, Validators.required],
      });

      resolve(true);
    });
  }

  borrar() {
    this.form.reset();
    this.form.controls.tipo_articulo_id.setValue(this.tipo_articulo.id);
    this.subCategoriaSelected = undefined;
  }

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
  }

  editarItem(data) {
    this.form.patchValue(data);
    this.subCategoriaSelected = fun.deepCloning(data);
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = ['id', 'descripcion'];
    const formValue = fun.pick(this.form.getRawValue(), pick_values);

    const originalValue = fun.pick(
      this.listaSubTipoArticulos.find(categoria => categoria.id == formValue.id),
      pick_values
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

    this.subTipoArticuloClass.createOne(formulario).then(res => {
      this.borrar();

      const actualPagination = this.tServ.getPaginationById('listado_sub_tipo_articulos');
      this.getSubTipoArticulos(actualPagination);
    });
  }

  btn_aceptar() {}
}
