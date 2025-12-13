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
import { Subject, takeUntil } from 'rxjs';

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
  // Inputs
  inputs = input.required<CuentaContableFormInputs>();
  configuration = input<CuentaContableFormConfig>({});
  camposDisabled = input<boolean>(false);
  infoTipoArticulo = input<{ categoria?: TipoArticuloI; sub_categoria?: SubTipoArticuloI }>();
  cuentaContableDataCruda = input<EntidadCuentaContableI>();
  cuentaContableData = input<FormEntidadCuentaContableI>();

  // Output
  cuentaContableDataChange = output<FormEntidadCuentaContableI>();

  // Estado interno
  form = signal<FormGroup | null>(null);
  listadoCategorias = signal<CategoriaEntidadContableI[]>([]);
  hasCategories = signal(true);
  dataOriginal = signal<FormEntidadCuentaContableI | null>(null);
  private lastLoadedId = signal<number | null>(null);
  private onDestroy$ = new Subject<void>();

  // Helpers
  configEntContableClass = new ConfiguracionEntidadCuentaC();
  agrupacionesContables = agrupacionesContables;
  fun = fun;

  // Computed
  isArticulo = computed(() => this.inputs()?.entidad === CategoriaEntidadContableC.entidad.articulo);

  cuentaIsCreated = computed(() => {
    const crudaData = this.cuentaContableDataCruda();
    return fun.hasValue(crudaData?.id) && fun.hasValue(crudaData?.cuenta_contable);
  });

  individualConfig = computed(() => {
    const config = fun.deepCloning(this.configuration());
    const selectedConfig = this.inputs().selectedConfig;
    const infoTipo = this.infoTipoArticulo();

    if (!selectedConfig.has_individual) config.btn.individual = false;
    if (!selectedConfig.has_categoria) config.btn.categoria = false;
    if (!selectedConfig.has_sub_categoria) config.btn.subCategoria = false;

    if (this.isArticulo()) {
      const cuentaCategoria = infoTipo?.categoria?.cuentas_contables?.find(c => c.key === selectedConfig.key);
      const cuentaSubCategoria = infoTipo?.sub_categoria?.cuentas_contables?.find(c => c.key === selectedConfig.key);
      if (fun.isEmpty(cuentaCategoria)) config.btn.categoria = false;
      if (fun.isEmpty(cuentaSubCategoria)) config.btn.subCategoria = false;
    }

    return config;
  });

  showRevertBtn = computed(() => {
    const original = this.dataOriginal();
    const current = this.form()?.getRawValue();
    return original && current ? !fun.isEqual(original, current) : false;
  });

  cuentaControlLabel = computed(() => this.computeCuentaLabel('control'));
  cuentaContableLabel = computed(() => this.computeCuentaLabel('contable'));

  constructor(
    private fb: FormBuilder,
    public catEntContServ: CategoriaEntidadContableService
  ) {
    // Effect para sincronizar datos cuando cambia el registro
    effect(() => {
      const data = this.cuentaContableData();
      const currentForm = this.form();
      if (!data || !currentForm) return;

      const isNewRecord = data.id !== this.lastLoadedId();
      currentForm.patchValue(data, { emitEvent: false });

      if (isNewRecord) {
        this.syncFormState();
        this.dataOriginal.set(fun.deepCloning(currentForm.getRawValue()));
        this.lastLoadedId.set(data.id);
      }
    });
  }

  ngOnInit(): void {
    this.createForm();
    this.catEntContServ.categoriasChange$.pipe(takeUntil(this.onDestroy$)).subscribe(value => {
      if (value && !this.isArticulo()) this.getCategorias();
    });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  private createForm() {
    const data = this.cuentaContableData();
    const selectedConfig = this.inputs().selectedConfig;

    this.form.set(
      this.fb.group({
        id: [data?.id ?? null],
        tipo_agrupacion_contable: [data?.tipo_agrupacion_contable ?? null, Validators.required],
        tipo_categoria: [data?.tipo_categoria ?? null],
        tipo_categoria_id: [data?.tipo_categoria_id ?? null],
        is_comun: [this.getDefaultValueIsComun(data?.is_comun)],
        has_cuenta: [data ? data.tipo_agrupacion_contable !== agrupacionesContables.sin_cuenta : true],
        configuracion_entidad_cuenta_id: [data?.configuracion_entidad_cuenta_id ?? selectedConfig.id],
      })
    );

    this.syncFormState();
    this.dataOriginal.set(fun.deepCloning(this.form().getRawValue()));
    this.lastLoadedId.set(data?.id ?? null);

    this.form()
      .valueChanges.pipe(takeUntil(this.onDestroy$))
      .subscribe(() => fun.awaitTyping({ waitingTime: 250 }).then(() => this.cuentaContableDataChange.emit(this.form().getRawValue())));

    if (!this.isArticulo()) this.getCategorias();
  }

  // Sincroniza el estado de los controles (disabled/enabled)
  private syncFormState() {
    const form = this.form();
    if (!form) return;

    const isCreated = this.cuentaIsCreated();
    const isDisabled = this.camposDisabled();
    const shouldLock = isCreated || isDisabled;

    ['tipo_categoria', 'tipo_categoria_id', 'is_comun', 'has_cuenta', 'configuracion_entidad_cuenta_id'].forEach(name => {
      shouldLock ? form.get(name)?.disable({ emitEvent: false }) : form.get(name)?.enable({ emitEvent: false });
    });

    isDisabled ? form.get('tipo_agrupacion_contable')?.disable({ emitEvent: false }) : form.get('tipo_agrupacion_contable')?.enable({ emitEvent: false });

    // is_comun tiene lógica adicional
    if (!shouldLock) {
      const isComunEnabled = enableIsComunSwitch({
        selectedConfig: this.inputs().selectedConfig,
        entidad: this.inputs().entidad,
        isArticulo: this.isArticulo(),
        formValue: form.getRawValue(),
      });
      isComunEnabled ? form.get('is_comun')?.enable({ emitEvent: false }) : form.get('is_comun')?.disable({ emitEvent: false });
    }
  }

  private getDefaultValueIsComun(currentValue?: boolean): boolean {
    const hasComun = this.inputs().selectedConfig.has_comun;
    return hasComun ? (currentValue ?? false) : !hasComun;
  }

  private getCuentaPerConfig() {
    const formValue = this.form()?.getRawValue();
    const infoTipo = this.infoTipoArticulo();
    return infoTipo?.[formValue?.tipo_agrupacion_contable]?.cuentas_contables?.find(c => c.key === this.inputs().selectedConfig.key);
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
    if (original && this.form()) {
      this.form().patchValue(original);
      this.syncFormState();
    }
  }

  changeHasCuenta() {
    const f = this.form();
    if (!f) return;

    const hasCuenta = f.get('has_cuenta')?.value;
    f.patchValue({
      tipo_agrupacion_contable: hasCuenta ? null : agrupacionesContables.sin_cuenta,
      tipo_categoria: null,
      tipo_categoria_id: null,
      is_comun: false,
    });
  }

  changeAgrupacion(tipo: agrupacionContable) {
    const f = this.form();
    if (!f) return;

    f.patchValue({ tipo_agrupacion_contable: tipo, tipo_categoria_id: null });
    this.syncFormState();

    if (tipo === agrupacionesContables.individual && !this.cuentaIsCreated()) {
      f.get('is_comun')?.setValue(false);
    }

    if (this.isArticulo()) {
      const tipoCategoriaNuevo = tipo === agrupacionesContables.categoria ? tipoCategoria.tipoArticulo : tipo === agrupacionesContables.sub_categoria ? tipoCategoria.subTipoArticulo : null;
      f.get('tipo_categoria')?.setValue(tipoCategoriaNuevo);
      f.get('tipo_categoria_id')?.setValue(this.getCuentaPerConfig()?.origen_tipo_id ?? null);
    }
  }

  selectCategoria() {
    const f = this.form();
    if (!f) return;

    this.syncFormState();
    if (!this.isArticulo() && fun.isEmpty(f.get('tipo_categoria_id')?.value)) {
      f.get('is_comun')?.setValue(false);
    }
  }

  private computeCuentaLabel(tipo: 'control' | 'contable'): string {
    const formulario = this.form()?.getRawValue();
    const categorias = this.listadoCategorias();
    const selectedConfig = this.inputs().selectedConfig;
    const crudaData = this.cuentaContableDataCruda();

    if (!formulario) return `Seleccione la ${this.getDropDownInfo('description')}`;

    let cuenta: string | undefined;

    if (formulario.tipo_agrupacion_contable === 'individual') {
      cuenta = selectedConfig.cuenta_contable.label;
    } else if (formulario.tipo_agrupacion_contable) {
      const categoriaSelected = categorias.find(c => c.id === formulario.tipo_categoria_id);
      cuenta = formulario.is_comun ? (tipo === 'control' ? categoriaSelected?.cuenta_contable_control?.label : categoriaSelected?.cuenta_contable_auxiliar?.label) : categoriaSelected?.cuenta_contable_control?.label;

      if (this.isArticulo()) {
        const cuentaPerConfig = this.getCuentaPerConfig();
        const tipoCuenta = tipo === 'control' ? 'control' : formulario.is_comun ? 'auxiliar' : 'control';
        cuenta = cuentaPerConfig?.[`label_${tipoCuenta}`] || selectedConfig.cuenta_contable.label;
      }
    }

    // Mostrar cuenta del backend si no hay cambios
    if (fun.hasValue(crudaData) && tipo === 'contable' && !this.showRevertBtn()) {
      cuenta = crudaData?.cuenta_contable?.label;
    }

    return cuenta || `Seleccione la ${this.getDropDownInfo('description')}`;
  }

  getDropDownInfo(tipo: 'placeholder' | 'emptyMessage' | 'description'): string {
    const isCategoria = this.form()?.get('tipo_agrupacion_contable')?.value === 'categoria';
    if (tipo === 'emptyMessage') return `No existen ${isCategoria ? 'categorias' : 'sub categorias'} registradas.`;
    if (tipo === 'placeholder') return `Seleccione la ${isCategoria ? 'categoria' : 'sub categoria'}.`;
    return isCategoria ? 'Categoria' : 'Sub Categoria';
  }

  getIsComunSwitchTooltip(): string {
    const formValue = this.form()?.getRawValue();
    if (this.isArticulo()) {
      const isEnabled = enableIsComunSwitch({
        selectedConfig: this.inputs().selectedConfig,
        entidad: this.inputs().entidad,
        isArticulo: true,
        formValue,
      });
      if (!isEnabled) return 'Solo acepta cuenta común.';
    } else if (fun.isEmpty(formValue?.tipo_categoria_id)) {
      return `Primero ${this.getDropDownInfo('placeholder').toLowerCase()}`;
    }
    return '';
  }
}
