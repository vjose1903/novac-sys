import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { AsyncValidatorFn, FieldConfig, FieldState, FormState, SignalForm, ValidationError, ValidatorFn } from './signal-form.types';

/**
 * Interfaz del FieldControl callable
 * Llamar al campo retorna el valor: form.id()
 * También tiene métodos: form.id.set(), form.id.isValid(), etc.
 */
export interface FieldControl<V> {
  /** Llamar al campo retorna el valor */
  (): V;

  /** Signal del valor actual */
  readonly value: Signal<V>;

  /** Signal de si el campo es válido */
  readonly isValid: Signal<boolean>;

  /** Signal de los errores del campo */
  readonly errors: Signal<ValidationError[]>;

  /** Signal de si el campo fue tocado */
  readonly touched: Signal<boolean>;

  /** Signal de si el campo está dirty */
  readonly dirty: Signal<boolean>;

  /** Signal de si el campo está deshabilitado */
  readonly disabled: Signal<boolean>;

  /** Signal de si hay validación pendiente */
  readonly pending: Signal<boolean>;

  /** Signal del estado completo del campo */
  readonly state: Signal<FieldState<V>>;

  /** Establece el valor del campo */
  set(value: V): void;

  /** Actualiza el valor usando una función */
  update(fn: (current: V) => V): void;

  /** Resetea el campo a su valor inicial */
  reset(): void;

  /** Marca el campo como tocado */
  markAsTouched(): void;

  /** Marca el campo como no tocado */
  markAsUntouched(): void;

  /** Marca el campo como dirty */
  markAsDirty(): void;

  /** Marca el campo como pristine */
  markAsPristine(): void;

  /** Habilita el campo */
  enable(): void;

  /** Deshabilita el campo */
  disable(): void;

  /** Valida el campo */
  validate(): Promise<boolean>;

  /** Verifica si tiene un error específico */
  hasError(errorType?: string): boolean;

  /** Obtiene un error específico */
  getError(errorType: string): ValidationError | undefined;

  /** Agrega un validador */
  addValidator(validator: ValidatorFn<V>): void;

  /** Limpia todos los validadores */
  clearValidators(): void;

  /** Suscribe a cambios del valor */
  onChange(callback: (value: V) => void): () => void;
}

/**
 * Crea un FieldControl callable
 */
function createFieldControl<V>(form: SignalFormConfig<any>, key: string): FieldControl<V> {
  // Crear la función callable que retorna el valor
  const callable = (() => form.getValue(key)) as FieldControl<V>;

  // Agregar signals computados
  Object.defineProperty(callable, 'value', {
    get: () => computed(() => form.getValue(key)),
    enumerable: true,
  });

  Object.defineProperty(callable, 'state', {
    get: () => computed(() => form.getFieldState(key)),
    enumerable: true,
  });

  Object.defineProperty(callable, 'isValid', {
    get: () => computed(() => form.getFieldState(key).validation.isValid),
    enumerable: true,
  });

  Object.defineProperty(callable, 'errors', {
    get: () => computed(() => form.getFieldState(key).validation.errors),
    enumerable: true,
  });

  Object.defineProperty(callable, 'touched', {
    get: () => computed(() => form.getFieldState(key).touched),
    enumerable: true,
  });

  Object.defineProperty(callable, 'dirty', {
    get: () => computed(() => form.getFieldState(key).dirty),
    enumerable: true,
  });

  Object.defineProperty(callable, 'disabled', {
    get: () => computed(() => form.getFieldState(key).disabled),
    enumerable: true,
  });

  Object.defineProperty(callable, 'pending', {
    get: () => computed(() => form.getFieldState(key).validation.isPending),
    enumerable: true,
  });

  // Agregar métodos
  callable.set = (value: V) => form.setValue(key, value);
  callable.update = (fn: (current: V) => V) => form.updateValue(key, fn);
  callable.reset = () => form.resetField(key);
  callable.markAsTouched = () => form.markAsTouched(key);
  callable.markAsUntouched = () => form.markAsUntouched(key);
  callable.markAsDirty = () => form.markAsDirty(key);
  callable.markAsPristine = () => form.markAsPristine(key);
  callable.enable = () => form.enable(key);
  callable.disable = () => form.disable(key);
  callable.validate = () => form.validateField(key);
  callable.hasError = (errorType?: string) => form.hasError(key, errorType);
  callable.getError = (errorType: string) => form.getError(key, errorType);
  callable.addValidator = (validator: ValidatorFn<V>) => form.addValidator(key, validator);
  callable.clearValidators = () => form.clearValidators(key);
  callable.onChange = (callback: (value: V) => void) => form.onValueChange(key, callback);

  return callable;
}

/**
 * Tipo que representa los campos del formulario como FieldControl
 */
export type SignalFormFields<T extends Record<string, any>> = {
  [K in keyof T]: FieldControl<T[K]>;
};

export type SignalFormInstance<T extends Record<string, any>> = SignalFormConfig<T> & SignalFormFields<T>;

/**
 * Clase de configuración de formulario con Signals
 * 
 * Acceso a campos:
 * - form.id() - obtiene el valor directamente
 * - form.id.set(value) - establece el valor
 * - form.id.isValid() - verifica si es válido
 * - form.id.errors() - obtiene los errores
 * - form.id.markAsTouched() - marca como tocado
 */
export class SignalFormConfig<T extends Record<string, any>> implements SignalForm<T> {
  private _model: WritableSignal<T>;
  private _fieldConfigs: Map<keyof T, FieldConfig<T[keyof T]>> = new Map();
  private _fieldStates: WritableSignal<{ [K in keyof T]: FieldState<T[K]> }>;
  private _initialValues: T;
  private _validateOnChange: boolean;
  private _validateOnBlur: boolean;
  private _debounceTime: number;
  private _subscriptions: Map<string, Set<(value: any) => void>> = new Map();
  private _formSubscriptions: Set<(values: T) => void> = new Set();
  private _debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private _fieldControls: Map<keyof T, FieldControl<T[keyof T]>> = new Map();

  // Signals públicos
  readonly formValues: Signal<T>;
  readonly values: Signal<T>;
  readonly state: Signal<FormState<T>>;
  readonly isValid: Signal<boolean>;
  readonly isDirty: Signal<boolean>;
  readonly isTouched: Signal<boolean>;
  readonly isPending: Signal<boolean>;
  readonly errors: Signal<{ [K in keyof T]?: ValidationError[] }>;

  constructor(initialValues: T, fieldConfigs: Map<keyof T, FieldConfig<T[keyof T]>>, options: { validateOnChange?: boolean; validateOnBlur?: boolean; debounceTime?: number } = {}) {
    this._initialValues = { ...initialValues };
    this._fieldConfigs = fieldConfigs;
    this._validateOnChange = options.validateOnChange ?? true;
    this._validateOnBlur = options.validateOnBlur ?? true;
    this._debounceTime = options.debounceTime ?? 0;

    this._model = signal<T>({ ...initialValues });
    this._fieldStates = signal(this.createInitialFieldStates(initialValues));

    // Inicializar signals públicos
    this.formValues = computed(() => this._model());
    this.values = this.formValues;

    this.state = computed(() => {
      const fieldStates = this._fieldStates();
      const values = this._model();
      const errors: { [K in keyof T]?: ValidationError[] } = {};
      let isValid = true;
      let isPending = false;
      let touched = false;
      let dirty = false;

      for (const key of Object.keys(fieldStates) as (keyof T)[]) {
        const fieldState = fieldStates[key];
        if (fieldState.validation.errors.length > 0) {
          errors[key] = fieldState.validation.errors;
          isValid = false;
        }
        if (fieldState.validation.isPending) isPending = true;
        if (fieldState.touched) touched = true;
        if (fieldState.dirty) dirty = true;
      }

      return { values, touched, dirty, isValid, isPending, errors, fieldStates };
    });

    this.isValid = computed(() => {
      const fieldStates = this._fieldStates();
      return Object.values(fieldStates).every((state: FieldState) => state.validation.isValid);
    });

    this.isDirty = computed(() => {
      const fieldStates = this._fieldStates();
      return Object.values(fieldStates).some((state: FieldState) => state.dirty);
    });

    this.isTouched = computed(() => {
      const fieldStates = this._fieldStates();
      return Object.values(fieldStates).some((state: FieldState) => state.touched);
    });

    this.isPending = computed(() => {
      const fieldStates = this._fieldStates();
      return Object.values(fieldStates).some((state: FieldState) => state.validation.isPending);
    });

    this.errors = computed(() => {
      const fieldStates = this._fieldStates();
      const errors: { [K in keyof T]?: ValidationError[] } = {};

      for (const key of Object.keys(fieldStates) as (keyof T)[]) {
        const fieldState = fieldStates[key];
        if (fieldState.validation.errors.length > 0) errors[key] = fieldState.validation.errors;
      }

      return errors;
    });

    // Crear FieldControls para cada campo
    this.createFieldControls(initialValues);
  }

  private createFieldControls(values: T): void {
    for (const key of Object.keys(values) as (keyof T)[]) {
      const fieldControl = createFieldControl<T[keyof T]>(this, key as string);
      this._fieldControls.set(key, fieldControl);
      (this as any)[key] = fieldControl;
    }
  }

  private createInitialFieldStates(values: T): { [K in keyof T]: FieldState<T[K]> } {
    const states = {} as { [K in keyof T]: FieldState<T[K]> };

    for (const key of Object.keys(values) as (keyof T)[]) {
      const config = this._fieldConfigs.get(key);
      states[key] = {
        value: values[key],
        touched: false,
        dirty: false,
        disabled: config?.disabled ?? false,
        validation: { errors: [], isValid: true, isPending: false },
      };
    }

    return states;
  }

  // ========== MÉTODOS DE CAMPO ==========

  field<K extends keyof T>(key: K): FieldControl<T[K]> {
    return this._fieldControls.get(key) as FieldControl<T[K]>;
  }

  getValue<K extends keyof T>(key: K): T[K] {
    return this._model()[key];
  }

  setValue<K extends keyof T>(key: K, value: T[K]): void {
    const applyValue = () => {
      this._model.update(current => ({ ...current, [key]: value }));
      this.updateFieldState(key, { value, dirty: true });

      if (this._validateOnChange) this.validateFieldSync(key);

      this.notifyFieldSubscribers(key, value);
      this.notifyFormSubscribers();
    };

    if (this._debounceTime > 0) {
      const existingTimer = this._debounceTimers.get(String(key));
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(applyValue, this._debounceTime);
      this._debounceTimers.set(String(key), timer);
    } else {
      applyValue();
    }
  }

  setValues(values: Partial<T>): void {
    for (const key of Object.keys(values) as (keyof T)[]) {
      this.setValue(key, values[key] as T[typeof key]);
    }
  }

  getFieldState<K extends keyof T>(key: K): FieldState<T[K]> {
    return this._fieldStates()[key];
  }

  getFieldErrors<K extends keyof T>(key: K): ValidationError[] {
    return this._fieldStates()[key]?.validation.errors ?? [];
  }

  isFieldValid<K extends keyof T>(key: K): boolean {
    return this._fieldStates()[key]?.validation.isValid ?? true;
  }

  // ========== MÉTODOS DE ESTADO ==========

  markAsTouched(key?: keyof T): void {
    if (key) {
      this.updateFieldState(key, { touched: true });
      if (this._validateOnBlur) this.validateFieldSync(key);
    } else {
      const updates = {} as { [K in keyof T]: Partial<FieldState<T[K]>> };
      for (const k of Object.keys(this._model()) as (keyof T)[]) {
        updates[k] = { touched: true };
      }
      this.updateAllFieldStates(updates);
      if (this._validateOnBlur) this.validateAllSync();
    }
  }

  markAsUntouched(key?: keyof T): void {
    if (key) {
      this.updateFieldState(key, { touched: false });
    } else {
      const updates = {} as { [K in keyof T]: Partial<FieldState<T[K]>> };
      for (const k of Object.keys(this._model()) as (keyof T)[]) {
        updates[k] = { touched: false };
      }
      this.updateAllFieldStates(updates);
    }
  }

  markAsDirty(key?: keyof T): void {
    if (key) {
      this.updateFieldState(key, { dirty: true });
    } else {
      const updates = {} as { [K in keyof T]: Partial<FieldState<T[K]>> };
      for (const k of Object.keys(this._model()) as (keyof T)[]) {
        updates[k] = { dirty: true };
      }
      this.updateAllFieldStates(updates);
    }
  }

  markAsPristine(key?: keyof T): void {
    if (key) {
      this.updateFieldState(key, { dirty: false });
    } else {
      const updates = {} as { [K in keyof T]: Partial<FieldState<T[K]>> };
      for (const k of Object.keys(this._model()) as (keyof T)[]) {
        updates[k] = { dirty: false };
      }
      this.updateAllFieldStates(updates);
    }
  }

  enable(key?: keyof T): void {
    if (key) {
      this.updateFieldState(key, { disabled: false });
    } else {
      const updates = {} as { [K in keyof T]: Partial<FieldState<T[K]>> };
      for (const k of Object.keys(this._model()) as (keyof T)[]) {
        updates[k] = { disabled: false };
      }
      this.updateAllFieldStates(updates);
    }
  }

  disable(key?: keyof T): void {
    if (key) {
      this.updateFieldState(key, { disabled: true });
    } else {
      const updates = {} as { [K in keyof T]: Partial<FieldState<T[K]>> };
      for (const k of Object.keys(this._model()) as (keyof T)[]) {
        updates[k] = { disabled: true };
      }
      this.updateAllFieldStates(updates);
    }
  }

  // ========== MÉTODOS DE FORMULARIO ==========

  reset(values?: Partial<T>): void {
    const newValues = { ...this._initialValues, ...values };
    this._model.set(newValues);
    this._fieldStates.set(this.createInitialFieldStates(newValues));
    this.notifyFormSubscribers();
  }

  resetField<K extends keyof T>(key: K): void {
    const initialValue = this._initialValues[key];
    this._model.update(current => ({ ...current, [key]: initialValue }));
    this.updateFieldState(key, {
      value: initialValue,
      touched: false,
      dirty: false,
      validation: { errors: [], isValid: true, isPending: false },
    });
    this.notifyFieldSubscribers(key, initialValue);
    this.notifyFormSubscribers();
  }

  patchValues(values: Partial<T>): void {
    this._model.update(current => ({ ...current, ...values }));

    for (const key of Object.keys(values) as (keyof T)[]) {
      this.updateFieldState(key, { value: values[key], dirty: true });
      if (this._validateOnChange) this.validateFieldSync(key);
      this.notifyFieldSubscribers(key, values[key]);
    }

    this.notifyFormSubscribers();
  }

  async validate(): Promise<boolean> {
    const results = await Promise.all(Object.keys(this._model()).map(key => this.validateField(key as keyof T)));
    return results.every(isValid => isValid);
  }

  async validateField<K extends keyof T>(key: K): Promise<boolean> {
    const config = this._fieldConfigs.get(key);
    if (!config) return true;

    const value = this._model()[key];
    const errors: ValidationError[] = [];

    if (config.validators) {
      for (const validator of config.validators) {
        const error = validator(value);
        if (error) errors.push(error);
      }
    }

    if (config.asyncValidators && config.asyncValidators.length > 0) {
      this.updateFieldState(key, { validation: { errors, isValid: errors.length === 0, isPending: true } });

      const asyncResults = await Promise.all(config.asyncValidators.map(validator => validator(value)));
      for (const error of asyncResults) {
        if (error) errors.push(error);
      }
    }

    this.updateFieldState(key, { validation: { errors, isValid: errors.length === 0, isPending: false } });
    return errors.length === 0;
  }

  // ========== MÉTODOS DE SUSCRIPCIÓN ==========

  onValueChange<K extends keyof T>(key: K, callback: (value: T[K]) => void): () => void {
    const keyStr = String(key);
    if (!this._subscriptions.has(keyStr)) this._subscriptions.set(keyStr, new Set());

    this._subscriptions.get(keyStr)!.add(callback);

    return () => {
      this._subscriptions.get(keyStr)?.delete(callback);
    };
  }

  onFormChange(callback: (values: T) => void): () => void {
    this._formSubscriptions.add(callback);
    return () => {
      this._formSubscriptions.delete(callback);
    };
  }

  // ========== HELPERS ==========

  hasError<K extends keyof T>(key: K, errorType?: string): boolean {
    const errors = this.getFieldErrors(key);
    if (!errorType) return errors.length > 0;
    return errors.some(e => e.type === errorType);
  }

  getError<K extends keyof T>(key: K, errorType: string): ValidationError | undefined {
    return this.getFieldErrors(key).find(e => e.type === errorType);
  }

  getRawValues(): T {
    return { ...this._model() };
  }

  // ========== MÉTODOS PRIVADOS ==========

  private updateFieldState<K extends keyof T>(key: K, updates: Partial<FieldState<T[K]>>): void {
    this._fieldStates.update(current => ({
      ...current,
      [key]: { ...current[key], ...updates },
    }));
  }

  private updateAllFieldStates(updates: { [K in keyof T]: Partial<FieldState<T[K]>> }): void {
    this._fieldStates.update(current => {
      const newStates = { ...current };
      for (const key of Object.keys(updates) as (keyof T)[]) {
        newStates[key] = { ...current[key], ...updates[key] };
      }
      return newStates;
    });
  }

  private validateFieldSync<K extends keyof T>(key: K): void {
    const config = this._fieldConfigs.get(key);
    if (!config || !config.validators) return;

    const value = this._model()[key];
    const errors: ValidationError[] = [];

    for (const validator of config.validators) {
      const error = validator(value);
      if (error) errors.push(error);
    }

    this.updateFieldState(key, { validation: { errors, isValid: errors.length === 0, isPending: false } });
  }

  private validateAllSync(): void {
    for (const key of Object.keys(this._model()) as (keyof T)[]) {
      this.validateFieldSync(key);
    }
  }

  private notifyFieldSubscribers<K extends keyof T>(key: K, value: T[K]): void {
    const keyStr = String(key);
    this._subscriptions.get(keyStr)?.forEach(callback => callback(value));
  }

  private notifyFormSubscribers(): void {
    const values = this._model();
    this._formSubscriptions.forEach(callback => callback(values));
  }

  // ========== MÉTODOS ADICIONALES ==========

  get model(): WritableSignal<T> {
    return this._model;
  }

  updateValue<K extends keyof T>(key: K, updateFn: (current: T[K]) => T[K]): void {
    const currentValue = this._model()[key];
    this.setValue(key, updateFn(currentValue));
  }

  hasChanges(): boolean {
    const current = this._model();
    for (const key of Object.keys(this._initialValues) as (keyof T)[]) {
      if (current[key] !== this._initialValues[key]) return true;
    }
    return false;
  }

  getChangedFields(): (keyof T)[] {
    const current = this._model();
    const changed: (keyof T)[] = [];

    for (const key of Object.keys(this._initialValues) as (keyof T)[]) {
      if (current[key] !== this._initialValues[key]) changed.push(key);
    }

    return changed;
  }

  setInitialValues(values: T): void {
    this._initialValues = { ...values };
  }

  addValidator<K extends keyof T>(key: K, validator: ValidatorFn<T[K]>): void {
    const config = this._fieldConfigs.get(key);
    if (config) {
      config.validators = [...(config.validators ?? []), validator];
      if (this._validateOnChange) this.validateFieldSync(key);
    }
  }

  clearValidators<K extends keyof T>(key: K): void {
    const config = this._fieldConfigs.get(key);
    if (config) {
      config.validators = [];
      this.updateFieldState(key, { validation: { errors: [], isValid: true, isPending: false } });
    }
  }

  destroy(): void {
    this._subscriptions.clear();
    this._formSubscriptions.clear();
    this._debounceTimers.forEach(timer => clearTimeout(timer));
    this._debounceTimers.clear();
  }
}
