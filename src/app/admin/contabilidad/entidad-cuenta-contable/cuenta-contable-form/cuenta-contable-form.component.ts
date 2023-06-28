import { fun } from './../../../../core/services/functions.service';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CategoriaEntidadContableService } from '../../categoria-entidad-contable/categoria-entidad-contable.service';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from '../../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { CategoriaEntidadContableI, entidadesContables } from '../../categoria-entidad-contable/categoria-entidad-contable.utils';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { EntidadCuentaContableI, agrupacionContable, agrupacionesContables } from './cuenta-contable-form.utils';
import { FormEntidadCuentaContableI } from './cuenta-contable-form.utils';

@Component({
  selector: 'cuenta-contable-form',
  templateUrl: './cuenta-contable-form.component.html',
  styleUrls: ['./cuenta-contable-form.component.scss'],
})
export class CuentaContableFormComponent implements OnInit, OnChanges {
  @Input() inputs: { selectedConfig: ConfiguracionEntidadCuentaI; entidad: entidadesContables };
  @Input() configuration: { btn?: { individual?: boolean; categoria?: boolean; subCategoria?: boolean } } = {};
  @Input() camposDisabled: boolean;

  @Input() cuentaContableDataCruda: EntidadCuentaContableI;

  @Input() cuentaContableData: FormEntidadCuentaContableI;
  @Output() cuentaContableDataChange = new EventEmitter<FormEntidadCuentaContableI>();

  form: UntypedFormGroup;
  listadoCategorias: Array<CategoriaEntidadContableI> = [];
  configEntContableClass = new ConfiguracionEntidadCuentaC();

  lastChange: FormEntidadCuentaContableI;
  agrupacionesContables = agrupacionesContables;

  fun = fun;

  dataOriginal: FormEntidadCuentaContableI;
  hasCategories: boolean = true;

  constructor(private fb: UntypedFormBuilder, public catEntContServ: CategoriaEntidadContableService) {}

  ngOnInit(): void {
    this.necesarioStart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.cuentaContableData?.currentValue && !changes?.cuentaContableData?.firstChange) {
      this.form.patchValue(this.cuentaContableData);
      this.updateOriginalData();
    }
  }

  async necesarioStart() {
    await this.createForm().then((form) => {
      form.valueChanges.subscribe((changes) => {
        if (!fun.isEqual(changes, this.lastChange)) this.returnData();
      });
    });
    await this.getCategorias();
    this.updateOriginalData();
  }

  updateOriginalData() {
    this.dataOriginal = fun.duplicarJson(this.cuentaContableData);
  }

  createForm() {
    return new Promise<UntypedFormGroup>((resolve, reject) => {
      this.form = this.fb.group({
        id: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.id : null, disabled: false }],
        tipo_agrupacion_contable: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.tipo_agrupacion_contable : null, disabled: false }, Validators.required],
        tipo_categoria: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.tipo_categoria : null, disabled: false }],
        tipo_categoria_id: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.tipo_categoria_id : null, disabled: false }],
        is_comun: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.is_comun : false, disabled: false }],
        has_cuenta: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.tipo_agrupacion_contable != agrupacionesContables.sin_cuenta : true, disabled: false }],
        configuracion_entidad_cuenta_id: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.configuracion_entidad_cuenta_id : this.inputs.selectedConfig.id, disabled: false }],
      });
      resolve(this.form);
    });
  }

  async getCategorias() {
    CategoriaEntidadContableService.getCategoriasByEntidad({ paginado: false, config_id: this.inputs.selectedConfig.id, entidad: this.inputs.entidad, showMsgs: false })
      .then((res) => (this.listadoCategorias = res['data']))
      .catch((err) => {
        this.hasCategories = false;
        // this.cuentaContableData.tipo_agrupacion_contable = agrupacionesContables.individual;
        // this.updateOriginalData();
        // if (fun.hasValue(this.form)) this.form.controls.tipo_agrupacion_contable.setValue(agrupacionesContables.individual);
      });
  }

  showRevertBtn() {
    const formulario = this.form?.getRawValue();
    return !fun.isEqual(this.dataOriginal, formulario);
  }

  revertChanges() {
    this.form.patchValue(this.dataOriginal);
    this.selectCategoria();
  }

  changeHasCuenta() {
    const formValue = this.form.getRawValue();
    const tipo_agrupacion = formValue.has_cuenta ? null : agrupacionesContables.sin_cuenta;

    this.form.controls.tipo_agrupacion_contable.setValue(tipo_agrupacion);

    this.form.controls.tipo_categoria.setValue(null);
    this.form.controls.tipo_categoria_id.setValue(null);
    this.form.controls.is_comun.setValue(false);
  }

  changeAgrupacion(tipo: agrupacionContable) {
    const formValue = this.form.getRawValue();
    this.form.controls.tipo_agrupacion_contable.setValue(tipo);
    this.form.controls.tipo_categoria_id.setValue(null);

    fun.hasValue(formValue.tipo_categoria_id) ? this.form.controls.is_comun.enable() : this.form.controls.is_comun.disable();
    if (tipo == agrupacionesContables.individual) this.form.controls.is_comun.setValue(false);
  }

  selectCategoria() {
    const formValue = this.form.getRawValue();

    fun.hasValue(formValue.tipo_categoria_id) ? this.form.controls.is_comun.enable() : this.form.controls.is_comun.disable();

    if (fun.isEmpty(formValue.tipo_categoria_id)) this.form.controls.is_comun.setValue(false);
  }

  getCuentaLabel(tipo: 'control' | 'contable') {
    const formulario = this.form.getRawValue();
    let cuenta;

    if (formulario.tipo_agrupacion_contable == 'individual') cuenta = this.inputs.selectedConfig.cuenta_contable.label;

    if (formulario.tipo_agrupacion_contable != 'individual') {
      const categoriaSelected = this.listadoCategorias.find((categoria) => categoria.id == formulario.tipo_categoria_id);

      if (formulario.is_comun) {
        if (tipo == 'control') {
          cuenta = categoriaSelected?.cuenta_contable_control.label;
        } else {
          cuenta = categoriaSelected?.cuenta_contable_auxiliar.label;
        }
      } else {
        cuenta = categoriaSelected?.cuenta_contable_control.label;
      }
    }

    if (fun.hasValue(this.cuentaContableDataCruda) && tipo == 'contable' && !this.showRevertBtn()) {
      cuenta = this.cuentaContableDataCruda?.cuenta_contable.label;
    }

    return cuenta || `Seleccione la ${this.getDropDownInfo('description')}`;
  }

  getDropDownInfo(tipo: 'placeholder' | 'emptyMessage' | 'description') {
    const formulario = this.form.getRawValue();
    let res = '';
    if (tipo == 'emptyMessage') res = `No existen ${formulario.tipo_agrupacion_contable == 'categoria' ? 'categorias' : 'sub categorias'} registradas.`;
    if (tipo == 'placeholder') res = `Seleccione la ${formulario.tipo_agrupacion_contable == 'categoria' ? 'categoria' : 'sub categoria'}.`;
    if (tipo == 'description') res = formulario.tipo_agrupacion_contable == 'categoria' ? 'Categoria' : 'Sub Categoria';
    return res;
  }

  returnData() {
    const formulario = this.form.getRawValue();
    this.lastChange = formulario;

    this.cuentaContableDataChange.emit(formulario);
  }
}
