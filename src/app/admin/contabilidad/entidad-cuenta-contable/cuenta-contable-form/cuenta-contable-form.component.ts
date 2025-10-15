import { fun } from './../../../../core/services/functions.service';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CategoriaEntidadContableService } from '../../categoria-entidad-contable/categoria-entidad-contable.service';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from '../../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { CategoriaEntidadContableC, CategoriaEntidadContableI, entidadesContables } from '../../categoria-entidad-contable/categoria-entidad-contable.utils';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { EntidadCuentaContableI, agrupacionContable, agrupacionesContables, enableIsComunSwitch, tipoCategoria } from './cuenta-contable-form.utils';
import { FormEntidadCuentaContableI } from './cuenta-contable-form.utils';
import { SubTipoArticuloI } from '../../../registros/articulos/tipo-articulo/sub-tipo-articulo/sub-tipo-articulo';
import { TipoArticuloI } from '../../../registros/articulos/tipo-articulo/tipo-articulo';
import { Subscription } from 'rxjs';

@Component({
  selector: 'cuenta-contable-form',
  templateUrl: './cuenta-contable-form.component.html',
  styleUrls: ['./cuenta-contable-form.component.scss'],
  standalone: false,
})
export class CuentaContableFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() inputs: { selectedConfig: ConfiguracionEntidadCuentaI; entidad: entidadesContables };
  @Input() configuration: { btn?: { individual?: boolean; categoria?: boolean; subCategoria?: boolean } } = {};
  @Input() camposDisabled: boolean;
  @Input() infoTipoArticulo: { categoria?: TipoArticuloI; sub_categoria?: SubTipoArticuloI };

  @Input() cuentaContableDataCruda: EntidadCuentaContableI;

  @Input() cuentaContableData: FormEntidadCuentaContableI;
  @Output() cuentaContableDataChange = new EventEmitter<FormEntidadCuentaContableI>();

  form: UntypedFormGroup;
  subCategoriaChange: Subscription;
  listadoCategorias: Array<CategoriaEntidadContableI> = [];
  configEntContableClass = new ConfiguracionEntidadCuentaC();

  lastChange: FormEntidadCuentaContableI;
  agrupacionesContables = agrupacionesContables;

  fun = fun;

  dataOriginal: FormEntidadCuentaContableI;
  hasCategories: boolean = true;
  currentEntidad: entidadesContables;

  isArticulo: boolean = false;

  individualConfig: { btn?: { individual?: boolean; categoria?: boolean; subCategoria?: boolean } };

  constructor(private fb: UntypedFormBuilder, public catEntContServ: CategoriaEntidadContableService) {}

  ngOnInit(): void {
    this.necesarioStart();
    this.subCategoriaChange = this.catEntContServ.categoriasChange$.subscribe((value: boolean) => {
      if (value && !this.isArticulo) this.getCategorias();
    });
  }

  ngOnDestroy(): void {
    if (this.subCategoriaChange) this.subCategoriaChange.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.cuentaContableData?.currentValue && !changes?.cuentaContableData?.firstChange) {
      this.form.patchValue(this.cuentaContableData);
      this.updateOriginalData();

      this.enableDisableIsComunSwitch();
    }

    if (fun.objHas(changes, 'configuration') || fun.objHas(changes, 'infoTipoArticulo')) this.checkConfig();
  }

  async necesarioStart() {
    this.currentEntidad = this.inputs.entidad;
    this.isArticulo = this.inputs?.entidad == CategoriaEntidadContableC.entidad.articulo;

    await this.createForm().then((form) => {
      this.enableDisableIsComunSwitch();
      form.valueChanges.subscribe((changes) => {
        fun.awaitTyping({ waitingTime: 250 }).then(() => {
          if (!fun.isEqual(changes, this.lastChange)) this.returnData();
        });
      });

      this.updateOriginalData();
    });

    if (!this.isArticulo) await this.getCategorias();
    this.checkConfig();
  }

  checkConfig() {
    this.individualConfig = fun.deepCloning(this.configuration);
    let cuenta_per_config_categoria;
    let cuenta_per_config_sub_categoria;

    if (this.isArticulo) {
      cuenta_per_config_categoria = this.infoTipoArticulo?.categoria?.cuentas_contables.find((cuenta_per_config) => cuenta_per_config.key == this.inputs.selectedConfig.key);
      cuenta_per_config_sub_categoria = this.infoTipoArticulo?.sub_categoria?.cuentas_contables.find((cuenta_per_config) => cuenta_per_config.key == this.inputs.selectedConfig.key);
    }

    if (!this.inputs.selectedConfig.has_individual) this.individualConfig.btn.individual = false;
    if (!this.inputs.selectedConfig.has_categoria || (this.isArticulo && fun.isEmpty(cuenta_per_config_categoria))) this.individualConfig.btn.categoria = false;
    if (!this.inputs.selectedConfig.has_sub_categoria || (this.isArticulo && fun.isEmpty(cuenta_per_config_sub_categoria))) this.individualConfig.btn.subCategoria = false;
  }

  updateOriginalData() {
    this.dataOriginal = fun.deepCloning(this.form.getRawValue());
  }

  createForm() {
    return new Promise<UntypedFormGroup>((resolve, reject) => {
      this.form = this.fb.group({
        id: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.id : null, disabled: false }],
        tipo_agrupacion_contable: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.tipo_agrupacion_contable : null, disabled: false }, Validators.required],
        tipo_categoria: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.tipo_categoria : null, disabled: false }],
        tipo_categoria_id: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.tipo_categoria_id : null, disabled: false }],
        is_comun: [{ value: fun.hasValue(this.cuentaContableData) ? this.getDefaultValueIsComun(this.cuentaContableData.is_comun) : this.getDefaultValueIsComun(), disabled: false }],
        has_cuenta: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.tipo_agrupacion_contable != agrupacionesContables.sin_cuenta : true, disabled: false }],
        configuracion_entidad_cuenta_id: [{ value: fun.hasValue(this.cuentaContableData) ? this.cuentaContableData.configuracion_entidad_cuenta_id : this.inputs.selectedConfig.id, disabled: false }],
      });
      resolve(this.form);
    });
  }

  getDefaultValueIsComun(currentValue?: boolean) {
    const has_comun = this.inputs.selectedConfig.has_comun;
    return has_comun ? currentValue : !has_comun;
  }

  getCuentaPerConfig() {
    const formValue = this.form.getRawValue();
    return this.infoTipoArticulo[formValue.tipo_agrupacion_contable]?.cuentas_contables.find((cuenta_per_config) => cuenta_per_config.key == this.inputs.selectedConfig.key);
  }

  async getCategorias() {
    CategoriaEntidadContableService.getCategoriasByEntidad({ paginado: false, config_id: this.inputs.selectedConfig.id, entidad: this.inputs.entidad, showMsgs: false })
      .then((res) => {
        this.listadoCategorias = res['data'];
        this.hasCategories = true;
      })
      .catch((err) => {
        this.hasCategories = false;
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
    this.form.controls.tipo_agrupacion_contable.setValue(tipo);
    this.form.controls.tipo_categoria_id.setValue(null);

    this.enableDisableIsComunSwitch();

    if (tipo == agrupacionesContables.individual) {
      this.form.controls.is_comun.setValue(false);
      this.form.controls.is_comun.disable();
    }

    if (this.isArticulo) {
      const tipo_categoria = tipo == agrupacionesContables.categoria ? tipoCategoria.tipoArticulo : tipo == agrupacionesContables.sub_categoria ? tipoCategoria.subTipoArticulo : null;
      this.form.controls.tipo_categoria.setValue(tipo_categoria);
      const cuentaPerConfig = this.getCuentaPerConfig();

      this.form.controls.tipo_categoria_id.setValue(cuentaPerConfig?.origen_tipo_id);
    }
  }

  selectCategoria() {
    const formValue = this.form.getRawValue();

    this.enableDisableIsComunSwitch();

    if (!this.isArticulo && fun.isEmpty(formValue.tipo_categoria_id)) this.form.controls.is_comun.setValue(false);
    this.checkConfig();
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

      if (this.isArticulo) {
        const cuenta_per_config = this.getCuentaPerConfig();
        const tipo_cuenta = tipo == 'control' ? 'control' : formulario.is_comun ? 'auxiliar' : 'control';

        let temp_cuenta = cuenta_per_config[`label_${tipo_cuenta}`];

        if (fun.isEmpty(temp_cuenta)) temp_cuenta = this.inputs.selectedConfig.cuenta_contable.label;

        cuenta = temp_cuenta;
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

  enableDisableIsComunSwitch() {
    const isComunSwitchEnable = enableIsComunSwitch({ selectedConfig: this.inputs.selectedConfig, entidad: this.currentEntidad, isArticulo: this.isArticulo, formValue: this.form.getRawValue() });
    isComunSwitchEnable ? this.form.controls.is_comun.enable() : this.form.controls.is_comun.disable();
  }

  getIsComunSwitchTooltip() {
    let tooltip = '';
    const formValue = this.form.getRawValue();

    if (this.isArticulo) {
      if (!enableIsComunSwitch({ selectedConfig: this.inputs.selectedConfig, entidad: this.currentEntidad, isArticulo: this.isArticulo, formValue: formValue })) tooltip = 'Solo acepta cuenta común.';
    } else {
      if (fun.isEmpty(formValue.tipo_categoria_id)) tooltip = `Primero ${this.getDropDownInfo('placeholder').toLowerCase()}`;
    }

    return tooltip;
  }

  returnData() {
    const formulario = this.form.getRawValue();
    this.lastChange = formulario;
    this.cuentaContableDataChange.emit(formulario);
  }
}
