import { signal, WritableSignal } from '@angular/core';
import { form, FieldState } from '@angular/forms/signals';

/**
 * Tipo del field de Angular Signal Forms
 */
type AngularField<V> = () => FieldState<V>;

/**
 * Tipo que mapea el modelo a fields de Angular
 */
type FieldsOf<T> = {
  [K in keyof T]: AngularField<T[K]>;
};

/**
 * Wrapper sobre Angular Signal Forms que agrega funcionalidades extras:
 * - hasChanges() - detectar cambios vs valores iniciales
 * - getChangedFields() - obtener campos modificados
 * - setInitialValues() - establecer punto de comparación
 * - patchValues() - actualizar múltiples valores
 * - reset() - resetear a valores iniciales
 * - getRawValues() - obtener valores como objeto plano
 * - onFormChange() - suscribirse a cambios del form
 *
 * La API nativa de Angular ya maneja:
 * - Acceso a campos: form.campo()
 * - Leer valor: form.campo().value()
 * - Escribir valor: form.campo().value.set(x)
 * - Estados: valid(), touched(), dirty(), disabled(), pending(), errors()
 */
export type SignalFormInstance<T extends Record<string, any>> = FieldsOf<T> & {
  /** Signal del modelo */
  readonly model: WritableSignal<T>;

  /** Verifica si hay cambios vs valores iniciales */
  hasChanges(): boolean;

  /** Obtiene campos que cambiaron */
  getChangedFields(): (keyof T)[];

  /** Establece valores iniciales para comparación */
  setInitialValues(values?: T): void;

  /** Actualiza múltiples valores */
  patchValues(values: Partial<T>): void;

  /** Resetea a valores iniciales */
  reset(values?: Partial<T>): void;

  /** Obtiene valores como objeto */
  getRawValues(): T;

  /** Obtiene valor de un campo */
  getValue<K extends keyof T>(key: K): T[K];

  /** Establece valor de un campo */
  setValue<K extends keyof T>(key: K, value: T[K]): void;

  /** Suscribe a cambios del form */
  onFormChange(callback: (values: T) => void): () => void;

  /** Limpia recursos */
  destroy(): void;
};

/**
 * Crea un formulario con Signal Forms de Angular + funcionalidades extras
 *
 * @example
 * ```typescript
 * // Crear form
 * const form = createSignalForm<LoginForm>({ email: '', password: '' });
 *
 * // API nativa de Angular (via proxy)
 * form.email().value()           // leer
 * form.email().value.set('x')    // escribir
 * form.email().valid()           // validación
 *
 * // Funcionalidades extras
 * form.hasChanges()
 * form.patchValues({ email: 'nuevo' })
 * form.reset()
 * ```
 */
export function createSignalForm<T extends Record<string, any>>(initialValues: T, schemaFn?: Parameters<typeof form>[1]): SignalFormInstance<T> {
  let _initialValues = { ...initialValues };
  const _model = signal<T>({ ...initialValues });
  const _fields = form(_model, schemaFn);
  const _formSubscriptions = new Set<(values: T) => void>();
  let _unsubscribe: (() => void) | null = null;

  const extras = {
    get model() {
      return _model;
    },

    hasChanges(): boolean {
      const current = _model();
      for (const key of Object.keys(_initialValues) as (keyof T)[]) {
        if (current[key] !== _initialValues[key]) return true;
      }
      return false;
    },

    getChangedFields(): (keyof T)[] {
      const current = _model();
      const changed: (keyof T)[] = [];
      for (const key of Object.keys(_initialValues) as (keyof T)[]) {
        if (current[key] !== _initialValues[key]) changed.push(key);
      }
      return changed;
    },

    setInitialValues(values?: T): void {
      _initialValues = { ...(values ?? _model()) };
    },

    patchValues(values: Partial<T>): void {
      _model.update(current => ({ ...current, ...values }));
    },

    reset(values?: Partial<T>): void {
      const newValues = { ..._initialValues, ...values };
      _model.set(newValues);
    },

    getRawValues(): T {
      return { ..._model() };
    },

    getValue<K extends keyof T>(key: K): T[K] {
      return _model()[key];
    },

    setValue<K extends keyof T>(key: K, value: T[K]): void {
      _model.update(current => ({ ...current, [key]: value }));
    },

    onFormChange(callback: (values: T) => void): () => void {
      _formSubscriptions.add(callback);

      if (!_unsubscribe) {
        let previousValue = JSON.stringify(_model());
        const checkChanges = () => {
          const currentValue = JSON.stringify(_model());
          if (currentValue !== previousValue) {
            previousValue = currentValue;
            _formSubscriptions.forEach(cb => cb(_model()));
          }
        };
        const interval = setInterval(checkChanges, 100);
        _unsubscribe = () => clearInterval(interval);
      }

      return () => {
        _formSubscriptions.delete(callback);
        if (_formSubscriptions.size === 0 && _unsubscribe) {
          _unsubscribe();
          _unsubscribe = null;
        }
      };
    },

    destroy(): void {
      _formSubscriptions.clear();
      if (_unsubscribe) {
        _unsubscribe();
        _unsubscribe = null;
      }
    },
  };

  // Proxy que combina fields de Angular + extras
  return new Proxy(_fields as object, {
    get(target, prop, receiver) {
      // Primero buscar en extras
      if (prop in extras) {
        const value = (extras as any)[prop];
        return typeof value === 'function' ? value.bind(extras) : value;
      }
      // Luego en fields de Angular (el target es _fields)
      const fieldValue = Reflect.get(target, prop, receiver);
      if (fieldValue !== undefined) {
        return fieldValue;
      }
      return undefined;
    },
    has(target, prop) {
      return prop in extras || prop in target;
    },
  }) as SignalFormInstance<T>;
}
