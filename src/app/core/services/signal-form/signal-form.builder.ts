import { form } from '@angular/forms/signals';
import { createSignalForm, SignalFormInstance } from './signal-form.config';

/**
 * Builder para crear formularios con Signal Forms
 * Usa la API nativa de Angular internamente
 *
 * @example
 * ```typescript
 * const form = SignalFormBuilder.create<LoginForm>({
 *   email: '',
 *   password: ''
 * })
 * .withSchema((schema) => {
 *   required(schema.email);
 *   email(schema.email);
 * })
 * .build();
 * ```
 */
export class SignalFormBuilder<T extends Record<string, any>> {
  private _initialValues: T;
  private _schemaFn?: Parameters<typeof form>[1];

  private constructor(initialValues: T) {
    this._initialValues = initialValues;
  }

  /**
   * Crea un builder con valores iniciales
   */
  static create<T extends Record<string, any>>(initialValues: T): SignalFormBuilder<T> {
    return new SignalFormBuilder<T>(initialValues);
  }

  /**
   * Configura el schema de validación (usa API nativa de Angular)
   */
  withSchema(schemaFn: Parameters<typeof form>[1]): SignalFormBuilder<T> {
    this._schemaFn = schemaFn;
    return this;
  }

  /**
   * Construye el formulario
   */
  build(): SignalFormInstance<T> {
    return createSignalForm<T>(this._initialValues, this._schemaFn);
  }
}

/**
 * Helper para crear formularios rápidamente
 */
export function signalForm<T extends Record<string, any>>(
  initialValues: T,
  schemaFn?: Parameters<typeof form>[1]
): SignalFormInstance<T> {
  return createSignalForm<T>(initialValues, schemaFn);
}
