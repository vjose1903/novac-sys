import { fun } from './../../../../core/services/functions.service';
import { Component, Input, OnInit } from '@angular/core';
import { CategoriaEntidadContableService } from '../../categoria-entidad-contable/categoria-entidad-contable.service';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from '../../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { CategoriaEntidadContableI, entidadesContables } from '../../categoria-entidad-contable/categoria-entidad-contable.utils';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { agrupacionContable } from './cuenta-contable-form.utils';

@Component({
  selector: 'cuenta-contable-form',
  templateUrl: './cuenta-contable-form.component.html',
  styleUrls: ['./cuenta-contable-form.component.scss'],
})
export class CuentaContableFormComponent implements OnInit {
  @Input() inputs: { selectedConfig: ConfiguracionEntidadCuentaI; entidad: entidadesContables };
  @Input() configuration: { btn?: { individual?: boolean; categoria?: boolean; subCategoria?: boolean } } = {};

  form: UntypedFormGroup;
  listadoCategorias: Array<CategoriaEntidadContableI> = [];
  configEntContableClass = new ConfiguracionEntidadCuentaC();

  fun = fun;
  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.necesarioStart();
  }

  async necesarioStart() {
    await this.getCategorias();
    await this.createForm();
  }

  createForm() {
    this.form = this.fb.group({
      id: [null],
      tipo_agrupacion_contable: [{ value: 'individual', disabled: false }, Validators.required],
      tipo_categoria_id: [{ value: null, disabled: false }],
      is_comun: [{ value: false, disabled: false }],
      configuracion_entidad_cuenta_id: [{ value: this.inputs.selectedConfig.id, disabled: false }],
    });
  }

  async getCategorias() {
    CategoriaEntidadContableService.getCategoriasByEntidad({ paginado: false, config_id: this.inputs.selectedConfig.id, entidad: this.inputs.entidad }).then((res) => {
      this.listadoCategorias = res['data'];
    });
  }

  changeAgrupacion(tipo: agrupacionContable) {
    const formValue = this.form.getRawValue();
    this.form.controls.tipo_agrupacion_contable.setValue(tipo);
    this.form.controls.tipo_categoria_id.setValue(null);
    fun.hasValue(formValue.tipo_categoria_id) ? this.form.controls.is_comun.enable() : this.form.controls.is_comun.disable();
  }

  selectCategoria() {
    const formValue = this.form.getRawValue();

    fun.hasValue(formValue.tipo_categoria_id) ? this.form.controls.is_comun.enable() : this.form.controls.is_comun.disable();

    if (fun.isEmpty(formValue.tipo_categoria_id)) this.form.controls.is_comun.setValue(false);
  }

  getCuentaControlLabel() {
    const formulario = this.form.getRawValue();
    let cuentaControl;

    if (formulario.tipo_agrupacion_contable == 'individual') cuentaControl = this.inputs.selectedConfig.cuenta_contable.label;
    if (formulario.tipo_agrupacion_contable != 'individual') {
      const categoriaSelected = this.listadoCategorias.find((categoria) => categoria.id == formulario.tipo_categoria_id);

      if (formulario.is_comun) {
        cuentaControl = categoriaSelected?.cuenta_contable_auxiliar.label;
      } else {
        cuentaControl = categoriaSelected?.cuenta_contable_control.label;
      }
    }

    return cuentaControl || `Seleccione la ${this.getDropDownInfo('description')}`;
  }

  getDropDownInfo(tipo: 'placeholder' | 'emptyMessage' | 'description') {
    const formulario = this.form.getRawValue();
    let res = '';
    if (tipo == 'emptyMessage') res = `No existen ${formulario.tipo_agrupacion_contable == 'categoria' ? 'categorias' : 'sub categorias'} registradas.`;
    if (tipo == 'placeholder') res = `Seleccione la ${formulario.tipo_agrupacion_contable == 'categoria' ? 'categoria' : 'sub categoria'}.`;
    if (tipo == 'description') res = formulario.tipo_agrupacion_contable == 'categoria' ? 'Categoria' : 'Sub Categoria';
    return res;
  }
}
