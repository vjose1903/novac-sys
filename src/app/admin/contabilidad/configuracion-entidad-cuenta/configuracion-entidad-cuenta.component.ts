import { MixinClass } from './../../../core/typescript/MixinClass';
import { TablasService } from './../../components/new_tablas/tablas.service';
import { fun } from './../../../core/services/functions.service';
import { Permisos } from './../../../core/typescript/permisos';
import { table_config } from './../../components/new_tablas/tabla-class';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ConfigruacionEntidadCuentaC } from './configuracion-entidad-cuenta';
// import * as _ from 'lodash';
@Component({
  selector: 'app-configuracion-entidad-cuenta',
  templateUrl: './configuracion-entidad-cuenta.component.html',
  styleUrls: ['./configuracion-entidad-cuenta.component.scss'],
})
export class ConfiguracionEntidadCuentaComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  botonLabel: string = '';
  isCreando: boolean = false;
  permissions = Permisos;
  formPermissions = [Permisos.configuracion_entidad_cuenta.update];

  listaConfiguraciones = [];
  configuracionSelected: any;

  configruacionClass = new ConfigruacionEntidadCuentaC();

  table_config: table_config = {
    info: [
      { titulo: 'Nombre', tipo: 'text', key: 'nombre_completo' },
      { titulo: 'Telefono', tipo: 'text', key: 'telefono' },
      { titulo: 'Cedula', tipo: 'text', key: 'documento_identidad' },
      { titulo: 'Role', tipo: 'textList', key: 'roles', key_value: 'nombre' },
    ],

    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_empleados',
    padre_functions: { data_request: (params) => this.getConfiguraciones(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: [10, 15, 20, 30], search: ' ', is_local: false },
    botones: { editar: { show: true, permiso: this.permissions.user.update }, borrar: { show: true, permiso: this.permissions.user.destroy } },
  };
  tablaComponent;

  constructor(private fb: UntypedFormBuilder, private tServ: TablasService) {
    super();
  }

  ngOnInit(): void {
    this.botonLabel = 'Registrar';

    this._init_mixin({ component: 'reg_empleados', is_routing: true });

    this.necesarioStart();
  }
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  async necesarioStart() {
    await this.createForm();
    await this.getConfiguraciones(this.tServ.obj_paginate.default);
    fun.enfocarInput('cedula');
  }

  createForm() {
    this.form = this.fb.group({
      id: [null],
    });
  }

  async getConfiguraciones(params?: { per_page: number; page: number; search: string }) {
    try {
      const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

      const extra = {};

      this.listaConfiguraciones.length = 0;

      this.configruacionClass.getAll(extra).then((res) => {
        res['data'].map((empleado) => {
          return empleado;
        });

        this.listaConfiguraciones = res['data'];
        this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
      });
    } catch (error) {
      fun.toastError('Error buscando empleados registrados.', 'ERROR');
    }
  }

  formIsInvalid() {
    let res = true;
    if (this.form.valid) {
      res = false;
    } else {
      res = true;
    }
    return res;
  }

  nuevoRegistro() {
    this.isCreando = true;
  }

  saltar(sali_de) {
    if (sali_de != 'send') {
    } else {
      if (!this.formIsInvalid()) setTimeout(() => this.requests(), 250);
    }
  }

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();

    fun.enfocarInput('cedula');
    this.botonLabel = 'Registrar';
    this.isCreando = true;

    this.configuracionSelected = undefined;
  }

  requests() {
    const formValue = this.form.getRawValue();
    console.log('formValue ', formValue);

    // this.configruacionClass.createUpdateOne(formValue).then((res) => {
    //   // this.getConfiguraciones(this.filter_target);
    // });
  }
}
