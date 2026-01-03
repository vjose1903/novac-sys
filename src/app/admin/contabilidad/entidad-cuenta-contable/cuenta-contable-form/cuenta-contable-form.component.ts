import { fun } from './../../../../core/services/functions.service';
import { Component, OnDestroy, OnInit, computed, input, output, signal } from '@angular/core';
import { CategoriaEntidadContableService } from '../../categoria-entidad-contable/categoria-entidad-contable.service';
import { ConfiguracionEntidadCuentaC } from '../../configuracion-entidad-cuenta/configuracion-entidad-cuenta.utils';
import { CategoriaEntidadContableC, CategoriaEntidadContableI } from '../../categoria-entidad-contable/categoria-entidad-contable.utils';
import {
  CuentaContableFormConfig,
  CuentaContableFormInputs,
  CuentaContableFormModel,
  EntidadCuentaContableI,
  agrupacionContable,
  agrupacionesContables,
  enableIsComunSwitch,
  FormEntidadCuentaContableI,
  tipoCategoria,
  createCuentaContableForm,
  mapDataToFormModel,
} from './cuenta-contable-form.utils';
import { SubTipoArticuloI } from '../../../registros/articulos/tipo-articulo/sub-tipo-articulo/sub-tipo-articulo';
import { TipoArticuloI } from '../../../registros/articulos/tipo-articulo/tipo-articulo';
import { Subject, takeUntil } from 'rxjs';
import { SignalFormInstance } from './../../../../core/services/signal-form/signal-form.config';

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

  // Signal Form - acceso directo a campos: form.id(), form.tipo_agrupacion_contable(), etc.
  form = createCuentaContableForm();

  // Estado adicional
  listadoCategorias = signal<CategoriaEntidadContableI[]>([]);
  hasCategories = signal(true);
  private onDestroy$ = new Subject<void>();

  // Helpers
  configEntContableClass = new ConfiguracionEntidadCuentaC();
  agrupacionesContables = agrupacionesContables;
  fun = fun;

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

  showRevertBtn = computed(() => this.form.hasChanges());

  categoriaSeleccionada = computed(() => {
    const id = this.form.tipo_categoria_id();
    return this.listadoCategorias().find(c => c.id === id);
  });

  shouldLockFields = computed(() => this.cuentaIsCreated() || this.camposDisabled());

  isComunEnabled = computed(() => {
    if (this.shouldLockFields()) return false;
    return enableIsComunSwitch({
      selectedConfig: this.inputs().selectedConfig,
      entidad: this.inputs().entidad,
      isArticulo: this.isArticulo(),
      formValue: this.form.getRawValues(),
    });
  });

  cuentaControlLabel = computed(() => this.computeCuentaLabel('control'));
  cuentaContableLabel = computed(() => this.computeCuentaLabel('contable'));

  constructor(public catEntContServ: CategoriaEntidadContableService) {}

  ngOnInit(): void {
    // Ejemplo: this.form.id.set(null) - acceso directo al FieldControl
    this.initFormModel();
    this.setupFormChangeListener();
    this.catEntContServ.categoriasChange$.pipe(takeUntil(this.onDestroy$)).subscribe(value => {
      if (value && !this.isArticulo()) this.getCategorias();
    });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
    this.form.destroy();
  }

  private initFormModel() {
    const data = this.cuentaContableData();
    const selectedConfig = this.inputs().selectedConfig;
    const formData = mapDataToFormModel(data, selectedConfig.id);

    formData.is_comun = this.getDefaultValueIsComun(data?.is_comun);

    this.form.patchValues(formData);
    this.form.setInitialValues(this.form.getRawValues());

    if (!this.isArticulo()) this.getCategorias();
  }

  private setupFormChangeListener() {
    this.form.onFormChange(values => {
      this.cuentaContableDataChange.emit(values as FormEntidadCuentaContableI);
    });
  }

  private getDefaultValueIsComun(currentValue?: boolean): boolean {
    const hasComun = this.inputs().selectedConfig.has_comun;
    return hasComun ? (currentValue ?? false) : !hasComun;
  }

  private getCuentaPerConfig() {
    const tipoAgrupacion = this.form.tipo_agrupacion_contable();
    const infoTipo = this.infoTipoArticulo();
    return infoTipo?.[tipoAgrupacion]?.cuentas_contables?.find(c => c.key === this.inputs().selectedConfig.key);
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
    this.form.reset();
  }

  changeHasCuenta(hasCuenta: boolean) {
    this.form.patchValues({
      has_cuenta: hasCuenta,
      tipo_agrupacion_contable: hasCuenta ? null : agrupacionesContables.sin_cuenta,
      tipo_categoria: null,
      tipo_categoria_id: null,
      is_comun: false,
    });
  }

  changeAgrupacion(tipo: agrupacionContable) {
    const updates: Partial<CuentaContableFormModel> = {
      tipo_agrupacion_contable: tipo,
      tipo_categoria_id: null,
    };

    if (tipo === agrupacionesContables.individual && !this.cuentaIsCreated()) {
      updates.is_comun = false;
    }

    if (this.isArticulo()) {
      updates.tipo_categoria = tipo === agrupacionesContables.categoria ? tipoCategoria.tipoArticulo : tipo === agrupacionesContables.sub_categoria ? tipoCategoria.subTipoArticulo : null;
      updates.tipo_categoria_id = this.getCuentaPerConfig()?.origen_tipo_id ?? null;
    }

    this.form.patchValues(updates);
  }

  selectCategoria(tipoCategoriaId: number | null) {
    const updates: Partial<CuentaContableFormModel> = { tipo_categoria_id: tipoCategoriaId };

    if (!this.isArticulo()) {
      updates.tipo_categoria = fun.hasValue(tipoCategoriaId) ? 'categorias_entidades_contables' : null;
      if (fun.isEmpty(tipoCategoriaId)) updates.is_comun = false;
    }

    this.form.patchValues(updates);
  }

  toggleIsComun(value: boolean) {
    this.form.setValue('is_comun', value);
  }

  private computeCuentaLabel(tipo: 'control' | 'contable'): string {
    const tipoAgrupacion = this.form.tipo_agrupacion_contable();
    const tipoCategoriaId = this.form.tipo_categoria_id();
    const isComun = this.form.is_comun();
    const categorias = this.listadoCategorias();
    const selectedConfig = this.inputs().selectedConfig;
    const crudaData = this.cuentaContableDataCruda();

    let cuenta: string | undefined;

    if (tipoAgrupacion === 'individual') {
      cuenta = selectedConfig.cuenta_contable.label;
    } else if (tipoAgrupacion) {
      const categoriaSelected = categorias.find(c => c.id === tipoCategoriaId);
      cuenta = isComun ? (tipo === 'control' ? categoriaSelected?.cuenta_contable_control?.label : categoriaSelected?.cuenta_contable_auxiliar?.label) : categoriaSelected?.cuenta_contable_control?.label;

      if (this.isArticulo()) {
        const cuentaPerConfig = this.getCuentaPerConfig();
        const tipoCuenta = tipo === 'control' ? 'control' : isComun ? 'auxiliar' : 'control';
        cuenta = cuentaPerConfig?.[`label_${tipoCuenta}`] || selectedConfig.cuenta_contable.label;
      }
    }

    if (fun.hasValue(crudaData) && this.cuentaIsCreated() && tipo === 'contable' && !this.showRevertBtn()) {
      cuenta = crudaData?.cuenta_contable?.label;
    }

    return cuenta || `Seleccione la ${this.getDropDownInfo('description')}`;
  }

  getDropDownInfo(tipo: 'placeholder' | 'emptyMessage' | 'description'): string {
    const isCategoria = this.form.tipo_agrupacion_contable() === 'categoria';
    if (tipo === 'emptyMessage') return `No existen ${isCategoria ? 'categorias' : 'sub categorias'} registradas.`;
    if (tipo === 'placeholder') return `Seleccione la ${isCategoria ? 'categoria' : 'sub categoria'}.`;
    return isCategoria ? 'Categoria' : 'Sub Categoria';
  }

  getIsComunSwitchTooltip(): string {
    if (this.isArticulo()) {
      if (!this.isComunEnabled()) return 'Solo acepta cuenta común.';
    } else if (fun.isEmpty(this.form.tipo_categoria_id())) {
      return `Primero ${this.getDropDownInfo('placeholder').toLowerCase()}`;
    }
    return '';
  }
}
