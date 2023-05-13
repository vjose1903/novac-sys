import { CuentaContableC } from '../catalogo-cuentas-page/catalogo-cuentas/cuentas-contables-form/cuentas_contables.utils';
import { CuentaContableI } from '../catalogo-cuentas-page/catalogo-cuentas/cuentas-contables-form/cuentas_contables.utils';
import { MixinClass } from './../../../core/typescript/MixinClass';
import { TablasService } from './../../components/new_tablas/tablas.service';
import { fun } from './../../../core/services/functions.service';
import { Permisos } from './../../../core/typescript/permisos';
import { table_config } from './../../components/new_tablas/tabla-class';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from './configuracion-entidad-cuenta.utils';
// import * as _ from 'lodash';
@Component({
  selector: 'app-configuracion-entidad-cuenta',
  templateUrl: './configuracion-entidad-cuenta.component.html',
  styleUrls: ['./configuracion-entidad-cuenta.component.scss'],
})
export class ConfiguracionEntidadCuentaComponent extends MixinClass implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  botonLabel: string = 'Editar';
  isCreando: boolean = false;
  permissions = Permisos;
  formPermissions = [Permisos.configuracion_entidad_cuenta.update];

  listaConfiguraciones: Array<ConfiguracionEntidadCuentaI> = [];
  listaCuentasControl: Array<CuentaContableI> = [];
  configuracionSelected: any;

  configruacionClass = new ConfiguracionEntidadCuentaC();
  cuentaContableClass = new CuentaContableC();

  fun = fun;

  table_config: table_config = {
    info: [
      { titulo: 'Descripción', tipo: 'text', key: 'descripcion', estilos: [{ 'text-align': 'left' }, { 'padding-left': '2rem' }, { width: '30%' }] },
      { titulo: 'Cuenta contable', tipo: 'text', key: 'cuenta_contable.label', estilos: [{ 'text-align': 'left' }] },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_config_entidad_cuenta',
    botones: { editar: { show: true, permiso: this.permissions.configuracion_entidad_cuenta.update }, borrar: { show: false }, styles: { width: '5rem' } },
  };
  tablaComponent;

  constructor(private fb: UntypedFormBuilder, private tServ: TablasService) {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'config_entidad_cuenta', is_routing: true });
    this._init_mixin({ component: 'config_entidad_cuenta', is_routing: true });

    this.necesarioStart();
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy(): void {
    this._destroy_mixin();
  }

  async necesarioStart() {
    await this.createForm();
    await this.getCuentasControl('init');
    await this.getConfiguraciones();
    fun.enfocarInput('cedula');
  }

  createForm(data?) {
    this.form = this.fb.group({
      id: [{ value: fun.hasValue(data) ? data.id : null, disabled: false }],
      descripcion: [{ value: fun.hasValue(data) ? data.descripcion : '', disabled: true }],
      cuenta_contable_id: [{ value: fun.hasValue(data) ? data.cuenta_contable_id : '', disabled: false }, Validators.required],
    });
  }

  async getCuentasControl(arg?) {
    if (arg == 'init' || arg == 'clear' || (fun.objHas(arg, 'value') && arg?.originalEvent?.type != 'click')) {
      let filter_target = arg?.value;
      filter_target = fun.isEmpty(filter_target) ? '' : filter_target;

      if (arg == 'init' || arg == 'clear') {
        this.requestFilter(filter_target);
      } else {
        fun.awaitTyping().then(async () => this.requestFilter(filter_target));
      }
    }
  }

  async requestFilter(filter_target) {
    const res = await this.cuentaContableClass.getAll({ parameters: { filter_target: filter_target, cuenta_control_id: true, iterator: false, only_control: true, label: true } });
    this.listaCuentasControl = res.data;
  }

  async getConfiguraciones() {
    try {
      const extra = { parameters: { cuenta_contable_id: true } };

      this.listaConfiguraciones.length = 0;

      this.configruacionClass.getAll(extra).then((res) => {
        res['data'].map((configuracion) => {
          configuracion.customStyles = {
            descripcion: { 'text-align': 'start', 'padding-left': '2rem', width: '30%', 'font-weight': 500 },
            'cuenta_contable.label': { 'text-align': 'start' },
          };
          return configuracion;
        });

        this.listaConfiguraciones = res['data'];
        console.log('this.listaConfiguraciones ', this.listaConfiguraciones);

        this.tablaComponent.changeConfig([{ total_count: res.total_registros }]);
      });
    } catch (error) {
      fun.toastError('Error buscando empleados registrados.', 'ERROR');
    }
  }

  formIsInvalid() {
    let res = false;

    if (!this.form.valid || !this.checkIfSomethingIsDiferrent()) {
      res = true;
    }

    return res;
  }

  checkIfSomethingIsDiferrent() {
    const formValue = fun.pick(this.form.getRawValue(), ['id', 'cuenta_contable_id']);
    const originalValue = fun.pick(
      this.listaConfiguraciones.find((cuenta) => cuenta.id == formValue.id),
      ['id', 'cuenta_contable_id'],
    );

    return !fun.isEqual(formValue, originalValue);
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

  tableClick_action(params) {
    if (params.action == 'update') this.editarItem(params.data);
  }

  editarItem(config: ConfiguracionEntidadCuentaI) {
    this.form.patchValue(config);

    this.configuracionSelected = fun.duplicarJson(config);
  }

  reset() {
    const originalValue = this.listaConfiguraciones.find((cuenta) => cuenta.id == this.configuracionSelected.id);
    this.form.patchValue(fun.duplicarJson(originalValue));
  }

  borrar() {
    if (fun.hasValue(this.form)) this.form.reset();
    this.isCreando = false;
    this.configuracionSelected = undefined;
  }

  requests() {
    const formValue = this.form.value;
    console.log('formValue ', formValue);

    this.configruacionClass.createUpdateOne(formValue).then((res) => {
      this.getConfiguraciones();
      this.borrar();
    });
  }
}
