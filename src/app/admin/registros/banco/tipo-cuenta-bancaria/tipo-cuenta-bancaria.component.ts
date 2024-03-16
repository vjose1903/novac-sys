import { TablasService } from './../../../components/new_tablas/tablas.service';
import { Permisos } from './../../../../core/typescript/permisos';
import { tableCellType, table_config } from './../../../components/new_tablas/tabla-class';
import { TipoCuentaBancariaC, TipoCuentaBancariaI, tableTipoCuentaBancaria } from './tipo_cuenta_bancaria';
import { ModalComponentI, ModalI } from './../../../components/modal/modal-class';
import { MixinClass } from './../../../../core/typescript/MixinClass';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { fun } from './../../../../core/services/functions.service';
import { NgxPermissionsService } from 'ngx-permissions';

@Component({
  selector: 'app-tipo-cuenta-bancaria',
  templateUrl: './tipo-cuenta-bancaria.component.html',
  styleUrls: ['./tipo-cuenta-bancaria.component.scss'],
})
export class TipoCuentaBancariaComponent extends MixinClass implements OnInit, ModalI {
  modalComponent: ModalComponentI;
  inputs: TipoCuentaBancariaI;
  fun = fun;
  permissions = Permisos;
  hasPermissionsCreateUpdate: boolean;

  formGroup: UntypedFormGroup;
  formInitialValue: UntypedFormGroup;

  listaTipoCuentasBancarias: Array<TipoCuentaBancariaI> = [];
  tipoCuentaBancariaClass = new TipoCuentaBancariaC();
  tipoCuentaSelected: TipoCuentaBancariaI;

  table_config: table_config = {
    info: [{ titulo: 'Descripcion', key: 'descripcion', tipo: tableCellType.text, style: { 'text-align': 'left', width: '55%' } }],
    colores: true,
    padding: '0.5rem',
    id_tabla: tableTipoCuentaBancaria,
    padre_functions: { data_request: (params) => this.getTipoCuentasBancarias(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, is_local: false },
    botones: {
      editar: { show: true, permiso: this.permissions.tipo_cuenta_bancaria.update },
    },
  };
  tablaComponent: any;

  constructor(private fb: UntypedFormBuilder, private permissionsService: NgxPermissionsService, private tServ: TablasService) {
    super();
  }

  ngOnInit(): void {
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.createForm().then(() => {
      this.formInitialValue = this.formGroup.getRawValue();
      console.log('      this.formInitialValue ', this.formInitialValue);
    });

    this.initVariables();
    await this.getTipoCuentasBancarias(fun.deepCloning(this.tServ.obj_paginate.default));
  }

  createForm() {
    return new Promise<void>((resolve) => {
      this.formGroup = this.fb.group({
        id: [{ value: null, disabled: false }],
        descripcion: [{ value: null, disabled: false }, Validators.required],
      });

      resolve();
    });
  }

  initVariables() {
    this.checkPermissions();
  }

  checkPermissions() {
    this.permissionsService.hasPermission([this.permissions.cuenta_bancaria.create, this.permissions.cuenta_bancaria.update]).then((result) => (this.hasPermissionsCreateUpdate = result));
  }

  getTipoCuentasBancarias(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;
    const extra = { parameters: { page: params.page, per_page: params.per_page, paginado: true, filter_target: palabra_a_buscar } };

    this.listaTipoCuentasBancarias.length = 0;
    this.tipoCuentaBancariaClass.getAll(extra).then((res) => {
      this.listaTipoCuentasBancarias = fun.deepCloning(res.data);
      console.log('res ', res);

      this.tablaComponent.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }

  checkIfSomethingIsDiferrent() {
    const pick_values = ['id', 'descripcion'];

    if (this.formGroup) {
      const formValue = fun.pick(this.formGroup.getRawValue(), pick_values);

      const originalValue = fun.pick(this.formInitialValue, pick_values);
      return !fun.isEqual(formValue, originalValue);
    } else {
      return false;
    }
  }

  borrar() {
    this.formGroup.reset();
    this.tipoCuentaSelected = undefined;
  }

  formIsInvalid() {
    let res = false;

    if (!this.formGroup.valid || (this.tipoCuentaSelected && !this.checkIfSomethingIsDiferrent())) {
      res = true;
    }

    return res;
  }

  tableClick_action(evento) {
    if (evento.action == 'update') {
      this.formGroup.patchValue(evento.data);
      this.tipoCuentaSelected = evento.data;
    }
  }

  btn_aceptar() {
    const formulario = this.formGroup.getRawValue();

    this.tipoCuentaBancariaClass.createOne(formulario).then((res) => {
      this.borrar();

      const actualPagination = this.tServ.getPaginationById(tableTipoCuentaBancaria);
      this.getTipoCuentasBancarias(actualPagination);
    });
  }
}
