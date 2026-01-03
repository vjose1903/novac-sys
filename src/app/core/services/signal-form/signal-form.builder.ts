import { FieldConfig, ISignalFormBuilder } from './signal-form.types';
import { SignalFormConfig, SignalFormInstance } from './signal-form.config';

/**
 * Builder para crear formularios con Signals
 *
 * @example
 * ```typescript
 * interface LoginForm {
 *   email: string;
 *   password: string;
 *   remember: boolean;
 * }
 *
 * const form = SignalFormBuilder.create<LoginForm>()
 *   .addField('email', {
 *     defaultValue: '',
 *     validators: [SignalFormValidators.required(), SignalFormValidators.email()]
 *   })
 *   .addField('password', {
 *     defaultValue: '',
 *     validators: [SignalFormValidators.required(), SignalFormValidators.minLength(6)]
 *   })
 *   .addField('remember', { defaultValue: false })
 *   .setValidateOnChange(true)
 *   .build();
 *
 * // Usar el formulario
 * form.setValue('email', 'test@example.com');
 * console.log(form.values()); // { email: 'test@example.com', password: '', remember: false }
 * console.log(form.isValid()); // false (password está vacío)
 * ```
 */
export class SignalFormBuilder<T extends Record<string, any>> implements ISignalFormBuilder<T> {
  private _fieldConfigs: Map<keyof T, FieldConfig<T[keyof T]>> = new Map();
  private _initialValues: Partial<T> = {};
  private _validateOnChange = true;
  private _validateOnBlur = true;
  private _debounceTime = 0;

  private constructor() {}

  /**
   * Crea una nueva instancia del builder
   */
  static create<T extends Record<string, any>>(): SignalFormBuilder<T> {
    return new SignalFormBuilder<T>();
  }

  /**
   * Crea un formulario a partir de valores iniciales
   * Los campos se crean automáticamente sin validadores
   */
  static fromValues<T extends Record<string, any>>(values: T): SignalFormInstance<T> {
    const builder = new SignalFormBuilder<T>();

    for (const key of Object.keys(values) as (keyof T)[]) {
      builder.addField(key, { defaultValue: values[key] });
    }

    return builder.build();
  }

  /**
   * Crea un formulario a partir de una configuración completa
   */
  static fromConfig<T extends Record<string, any>>(config: {
    fields: { [K in keyof T]: Omit<FieldConfig<T[K]>, 'key'> };
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounceTime?: number;
  }): SignalFormInstance<T> {
    const builder = new SignalFormBuilder<T>();

    for (const key of Object.keys(config.fields) as (keyof T)[]) {
      builder.addField(key, config.fields[key]);
    }

    if (config.validateOnChange !== undefined) builder.setValidateOnChange(config.validateOnChange);
    if (config.validateOnBlur !== undefined) builder.setValidateOnBlur(config.validateOnBlur);
    if (config.debounceTime !== undefined) builder.setDebounceTime(config.debounceTime);

    return builder.build();
  }

  /**
   * Agrega un campo al formulario
   */
  addField<K extends keyof T>(key: K, config: Omit<FieldConfig<T[K]>, 'key'>): SignalFormBuilder<T> {
    const fullConfig: FieldConfig<T[K]> = {
      key: key as string,
      ...config,
    };

    this._fieldConfigs.set(key, fullConfig as FieldConfig<T[keyof T]>);
    this._initialValues[key] = config.defaultValue;

    return this;
  }

  /**
   * Configura si se debe validar al cambiar el valor
   */
  setValidateOnChange(value: boolean): SignalFormBuilder<T> {
    this._validateOnChange = value;
    return this;
  }

  /**
   * Configura si se debe validar al perder el foco
   */
  setValidateOnBlur(value: boolean): SignalFormBuilder<T> {
    this._validateOnBlur = value;
    return this;
  }

  /**
   * Configura el tiempo de debounce para los cambios
   */
  setDebounceTime(ms: number): SignalFormBuilder<T> {
    this._debounceTime = ms;
    return this;
  }

  /**
   * Construye el formulario con acceso directo a campos
   * Ejemplo: form.email(), form.password()
   */
  build(): SignalFormInstance<T> {
    return new SignalFormConfig<T>(this._initialValues as T, this._fieldConfigs, {
      validateOnChange: this._validateOnChange,
      validateOnBlur: this._validateOnBlur,
      debounceTime: this._debounceTime,
    }) as SignalFormInstance<T>;
  }
}

/**
 * Helper para crear formularios rápidamente
 */
export function createSignalForm<T extends Record<string, any>>(config: {
  fields: { [K in keyof T]: Omit<FieldConfig<T[K]>, 'key'> };
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceTime?: number;
}): SignalFormInstance<T> {
  return SignalFormBuilder.fromConfig(config);
}

/**
 * Helper para crear formularios desde valores iniciales
 */
export function signalFormFromValues<T extends Record<string, any>>(values: T): SignalFormInstance<T> {
  return SignalFormBuilder.fromValues(values);
}

