import { fun } from './../../../../core/services/functions.service';
import { Component, OnDestroy, OnInit, computed, effect, input, output, signal } from '@angular/core';
import { CategoriaEntidadContableService } from '../../categoria-entidad-contable/categoria-entidad-contable.service';
import { ConfiguracionEntidadCuentaC, ConfiguracionEntidadCuentaI } from '../../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { CategoriaEntidadContableC, CategoriaEntidadContableI, entidadesContables } from '../../categoria-entidad-contable/categoria-entidad-contable.utils';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EntidadCuentaContableI, agrupacionContable, agrupacionesContables, enableIsComunSwitch, tipoCategoria } from './cuenta-contable-form.utils';
import { FormEntidadCuentaContableI } from './cuenta-contable-form.utils';
import { SubTipoArticuloI } from '../../../registros/articulos/tipo-articulo/sub-tipo-articulo/sub-tipo-articulo';
import { TipoArticuloI } from '../../../registros/articulos/tipo-articulo/tipo-articulo';
import { Subscription } from 'rxjs';

export interface CuentaContableFormInputs {
  selectedConfig: ConfiguracionEntidadCuentaI;
  entidad: entidadesContables;
}

export interface CuentaContableFormConfig {
  btn?: { individual?: boolean; categoria?: boolean; subCategoria?: boolean };
}

@Component({
  selector: 'cuenta-contable-form',
  templateUrl: './cuenta-contable-form.component.html',
  styleUrls: ['./cuenta-contable-form.component.scss'],
  standalone: false,
})
export class CuentaContableFormComponent implements OnInit, OnDestroy {
  // Inputs como signals
  inputs = input.required<CuentaContableFormInputs>();
  configuration = input<CuentaContableFormConfig>({});
  camposDisabled = input<boolean>(false);
  infoTipoArticulo = input<{ categoria?: TipoArticuloI; sub_categoria?: SubTipoArticuloI }>();
  cuentaContableDataCruda = input<EntidadCuentaContableI>();
  cuentaContableData = input<FormEntidadCuentaContableI>();

  // Output
  cuentaContableDataChange = output<FormEntidadCuentaContableI>();

  // Estado interno con signals
  form = signal<FormGroup | null>(null);
  formValue = signal<FormEntidadCuentaContableI | null>(null);
  listadoCategorias = signal<CategoriaEntidadContableI[]>([]);
  hasCategories = signal(true);
  dataOriginal = signal<FormEntidadCuentaContableI | null>(null);
  private lastLoadedId = signal<number | null>(null);

  // Subscriptions
  private subCategoriaChange: Subscription;
  private formValueChangeSub: Subscription;

  // Helpers
  configEntContableClass = new ConfiguracionEntidadCuentaC();
  agrupacionesContables = agrupacionesContables;
  fun = fun;

  // Computed values
  isArticulo = computed(() => this.inputs()?.entidad === CategoriaEntidadContableC.entidad.articulo);

  individualConfig = computed(() => {
    const config = fun.deepCloning(this.configuration());
    const selectedConfig = this.inputs().selectedConfig;
    const infoTipo = this.infoTipoArticulo();

    if (this.isArticulo()) {
      const cuentaCategoria = infoTipo?.categoria?.cuentas_contables?.find(c => c.key === selectedConfig.key);
      const cuentaSubCategoria = infoTipo?.sub_categoria?.cuentas_contables?.find(c => c.key === selectedConfig.key);

      if (!selectedConfig.has_individual) config.btn.individual = false;
      if (!selectedConfig.has_categoria || fun.isEmpty(cuentaCategoria)) config.btn.categoria = false;
      if (!selectedConfig.has_sub_categoria || fun.isEmpty(cuentaSubCategoria)) config.btn.subCategoria = false;
    } else {
      if (!selectedConfig.has_individual) config.btn.individual = false;
      if (!selectedConfig.has_categoria) config.btn.categoria = false;
      if (!selectedConfig.has_sub_categoria) config.btn.subCategoria = false;
    }

    return config;
  });

  showRevertBtn = computed(() => {
    const original = this.dataOriginal();
    const current = this.formValue();
    if (!original || !current) return false;
    return !fun.isEqual(original, current);
  });

  cuentaControlLabel = computed(() => this.computeCuentaLabel('control'));
  cuentaContableLabel = computed(() => this.computeCuentaLabel('contable'));

  constructor(
    private fb: FormBuilder,
    public catEntContServ: CategoriaEntidadContableService
  ) {
    // Effect para sincronizar datos de entrada con el formulario
    // Solo actualiza dataOriginal cuando cambia el registro (diferente id)
    effect(() => {
      const data = this.cuentaContableData();
      const currentForm = this.form();

      if (data && currentForm) {
        const isNewRecord = data.id !== this.lastLoadedId();
        
        currentForm.patchValue(data, { emitEvent: false });
        this.enableDisableIsComunSwitch();
        const rawValue = fun.deepCloning(currentForm.getRawValue());
        this.formValue.set(rawValue);
        
        // Solo actualizar dataOriginal si es un registro diferente
        if (isNewRecord) {
          this.dataOriginal.set(rawValue);
          this.lastLoadedId.set(data.id);
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForm();

    this.subCategoriaChange = this.catEntContServ.categoriasChange$.subscribe((value: boolean) => {
      if (value && !this.isArticulo()) this.getCategorias();
    });
  }

  ngOnDestroy(): void {
    this.subCategoriaChange?.unsubscribe();
    this.formValueChangeSub?.unsubscribe();
  }

  private initForm() {
    const data = this.cuentaContableData();
    const selectedConfig = this.inputs().selectedConfig;

    const formGroup = this.fb.group({
      id: [data?.id ?? null],
      tipo_agrupacion_contable: [data?.tipo_agrupacion_contable ?? null, Validators.required],
      tipo_categoria: [data?.tipo_categoria ?? null],
      tipo_categoria_id: [data?.tipo_categoria_id ?? null],
      is_comun: [this.getDefaultValueIsComun(data?.is_comun)],
      has_cuenta: [data ? data.tipo_agrupacion_contable !== agrupacionesContables.sin_cuenta : true],
      configuracion_entidad_cuenta_id: [data?.configuracion_entidad_cuenta_id ?? selectedConfig.id],
    });

    this.form.set(formGroup);
    this.enableDisableIsComunSwitch();
    this.updateFormValue();
    this.dataOriginal.set(fun.deepCloning(formGroup.getRawValue()));
    this.lastLoadedId.set(data?.id ?? null);

    // Suscribirse a cambios del formulario
    this.formValueChangeSub = formGroup.valueChanges.subscribe(() => {
      this.updateFormValue();
      fun.awaitTyping({ waitingTime: 250 }).then(() => this.emitChanges());
    });

    // Cargar categorías si no es artículo
    if (!this.isArticulo()) this.getCategorias();
  }

  private getDefaultValueIsComun(currentValue?: boolean): boolean {
    const hasComun = this.inputs().selectedConfig.has_comun;
    return hasComun ? (currentValue ?? false) : !hasComun;
  }

  private getCuentaPerConfig() {
    const formValue = this.formValue();
    const infoTipo = this.infoTipoArticulo();
    const selectedConfig = this.inputs().selectedConfig;

    return infoTipo?.[formValue?.tipo_agrupacion_contable]?.cuentas_contables?.find(c => c.key === selectedConfig.key);
  }

  async getCategorias() {
    try {
      const res = await CategoriaEntidadContableService.getCategoriasByEntidad({
        paginado: false,
        config_id: this.inputs().selectedConfig.id,
        entidad: this.inputs().entidad,
        showMsgs: false,
      });
      this.listadoCategorias.set(res['data']);
      this.hasCategories.set(true);
    } catch {
      this.hasCategories.set(false);
    }
  }

  revertChanges() {
    const original = this.dataOriginal();
    const currentForm = this.form();
    if (original && currentForm) {
      currentForm.patchValue(original);
      this.enableDisableIsComunSwitch();
      this.updateFormValue();
    }
  }

  changeHasCuenta() {
    const currentForm = this.form();
    if (!currentForm) return;

    const hasCuenta = currentForm.get('has_cuenta')?.value;
    const tipoAgrupacion = hasCuenta ? null : agrupacionesContables.sin_cuenta;

    currentForm.patchValue({
      tipo_agrupacion_contable: tipoAgrupacion,
      tipo_categoria: null,
      tipo_categoria_id: null,
      is_comun: false,
    });
  }

  changeAgrupacion(tipo: agrupacionContable) {
    const currentForm = this.form();
    if (!currentForm) return;

    currentForm.patchValue({
      tipo_agrupacion_contable: tipo,
      tipo_categoria_id: null,
    });

    this.enableDisableIsComunSwitch();

    if (tipo === agrupacionesContables.individual) {
      currentForm.get('is_comun')?.setValue(false);
      currentForm.get('is_comun')?.disable();
    }

    if (this.isArticulo()) {
      const tipoCategoriaNuevo =
        tipo === agrupacionesContables.categoria
          ? tipoCategoria.tipoArticulo
          : tipo === agrupacionesContables.sub_categoria
            ? tipoCategoria.subTipoArticulo
            : null;

      currentForm.get('tipo_categoria')?.setValue(tipoCategoriaNuevo);

      const cuentaPerConfig = this.getCuentaPerConfig();
      currentForm.get('tipo_categoria_id')?.setValue(cuentaPerConfig?.origen_tipo_id ?? null);
    }
  }

  selectCategoria() {
    const currentForm = this.form();
    if (!currentForm) return;

    this.enableDisableIsComunSwitch();

    const tipoCategoriaId = currentForm.get('tipo_categoria_id')?.value;
    if (!this.isArticulo() && fun.isEmpty(tipoCategoriaId)) {
      currentForm.get('is_comun')?.setValue(false);
    }
  }

  private computeCuentaLabel(tipo: 'control' | 'contable'): string {
    const formulario = this.formValue();
    const categorias = this.listadoCategorias();
    const showRevert = this.showRevertBtn();
    const selectedConfig = this.inputs().selectedConfig;
    const crudaData = this.cuentaContableDataCruda();

    if (!formulario) return `Seleccione la ${this.getDropDownInfo('description')}`;

    let cuenta: string | undefined;

    if (formulario.tipo_agrupacion_contable === 'individual') {
      cuenta = selectedConfig.cuenta_contable.label;
    } else if (formulario.tipo_agrupacion_contable) {
      const categoriaSelected = categorias.find(c => c.id === formulario.tipo_categoria_id);

      if (formulario.is_comun) {
        cuenta = tipo === 'control' ? categoriaSelected?.cuenta_contable_control?.label : categoriaSelected?.cuenta_contable_auxiliar?.label;
      } else {
        cuenta = categoriaSelected?.cuenta_contable_control?.label;
      }

      if (this.isArticulo()) {
        const cuentaPerConfig = this.getCuentaPerConfig();
        const tipoCuenta = tipo === 'control' ? 'control' : formulario.is_comun ? 'auxiliar' : 'control';
        let tempCuenta = cuentaPerConfig?.[`label_${tipoCuenta}`];

        if (fun.isEmpty(tempCuenta)) tempCuenta = selectedConfig.cuenta_contable.label;
        cuenta = tempCuenta;
      }
    }

    // Mostrar cuenta del backend si no hay cambios
    if (fun.hasValue(crudaData) && tipo === 'contable' && !showRevert) {
      cuenta = crudaData?.cuenta_contable?.label;
    }

    return cuenta || `Seleccione la ${this.getDropDownInfo('description')}`;
  }

  getDropDownInfo(tipo: 'placeholder' | 'emptyMessage' | 'description'): string {
    const formValue = this.formValue();
    const isCategoria = formValue?.tipo_agrupacion_contable === 'categoria';

    switch (tipo) {
      case 'emptyMessage':
        return `No existen ${isCategoria ? 'categorias' : 'sub categorias'} registradas.`;
      case 'placeholder':
        return `Seleccione la ${isCategoria ? 'categoria' : 'sub categoria'}.`;
      case 'description':
        return isCategoria ? 'Categoria' : 'Sub Categoria';
      default:
        return '';
    }
  }

  private enableDisableIsComunSwitch() {
    const currentForm = this.form();
    if (!currentForm) return;

    const isComunControl = currentForm.get('is_comun');
    const isEnabled = enableIsComunSwitch({
      selectedConfig: this.inputs().selectedConfig,
      entidad: this.inputs().entidad,
      isArticulo: this.isArticulo(),
      formValue: currentForm.getRawValue(),
    });

    isEnabled ? isComunControl?.enable() : isComunControl?.disable();
  }

  getIsComunSwitchTooltip(): string {
    const formValue = this.formValue();

    if (this.isArticulo()) {
      const isEnabled = enableIsComunSwitch({
        selectedConfig: this.inputs().selectedConfig,
        entidad: this.inputs().entidad,
        isArticulo: true,
        formValue: formValue,
      });
      if (!isEnabled) return 'Solo acepta cuenta común.';
    } else {
      if (fun.isEmpty(formValue?.tipo_categoria_id)) {
        return `Primero ${this.getDropDownInfo('placeholder').toLowerCase()}`;
      }
    }

    return '';
  }

  private updateFormValue() {
    const currentForm = this.form();
    if (currentForm) {
      this.formValue.set(fun.deepCloning(currentForm.getRawValue()));
    }
  }

  private emitChanges() {
    const currentForm = this.form();
    if (!currentForm) return;

    this.cuentaContableDataChange.emit(currentForm.getRawValue());
  }
}
