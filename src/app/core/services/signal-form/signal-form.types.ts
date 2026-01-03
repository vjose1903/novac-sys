import { Signal, WritableSignal } from '@angular/core';
import { SignalFormBuilder } from './signal-form.builder';

// Tipos de validadores
export type ValidatorFn<T> = (value: T) => ValidationError | null;
export type AsyncValidatorFn<T> = (value: T) => Promise<ValidationError | null>;

export interface ValidationError {
  type: string;
  message: string;
  [key: string]: any;
}

export interface FieldValidation {
  errors: ValidationError[];
  isValid: boolean;
  isPending: boolean;
}

// Estado de un campo
export interface FieldState<T = any> {
  value: T;
  touched: boolean;
  dirty: boolean;
  disabled: boolean;
  validation: FieldValidation;
}

// Configuración de un campo
export interface FieldConfig<T = any> {
  key: string;
  defaultValue: T;
  validators?: ValidatorFn<T>[];
  asyncValidators?: AsyncValidatorFn<T>[];
  disabled?: boolean;
}

// Configuración del formulario
export interface FormConfig<T extends Record<string, any>> {
  fields: { [K in keyof T]: FieldConfig<T[K]> };
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceTime?: number;
}

// Estado del formulario
export interface FormState<T extends Record<string, any>> {
  values: T;
  touched: boolean;
  dirty: boolean;
  isValid: boolean;
  isPending: boolean;
  errors: { [K in keyof T]?: ValidationError[] };
  fieldStates: { [K in keyof T]: FieldState<T[K]> };
}

// Interfaz del formulario construido
export interface SignalForm<T extends Record<string, any>> {
  // Signals de estado
  state: Signal<FormState<T>>;
  values: Signal<T>;
  isValid: Signal<boolean>;
  isDirty: Signal<boolean>;
  isTouched: Signal<boolean>;
  isPending: Signal<boolean>;
  errors: Signal<{ [K in keyof T]?: ValidationError[] }>;

  // Métodos de campo
  getValue<K extends keyof T>(key: K): T[K];
  setValue<K extends keyof T>(key: K, value: T[K]): void;
  setValues(values: Partial<T>): void;
  getFieldState<K extends keyof T>(key: K): FieldState<T[K]>;
  getFieldErrors<K extends keyof T>(key: K): ValidationError[];
  isFieldValid<K extends keyof T>(key: K): boolean;

  // Métodos de estado
  markAsTouched(key?: keyof T): void;
  markAsUntouched(key?: keyof T): void;
  markAsDirty(key?: keyof T): void;
  markAsPristine(key?: keyof T): void;
  enable(key?: keyof T): void;
  disable(key?: keyof T): void;

  // Métodos de formulario
  reset(values?: Partial<T>): void;
  patchValues(values: Partial<T>): void;
  validate(): Promise<boolean>;
  validateField<K extends keyof T>(key: K): Promise<boolean>;

  // Métodos de suscripción
  onValueChange<K extends keyof T>(key: K, callback: (value: T[K]) => void): () => void;
  onFormChange(callback: (values: T) => void): () => void;

  // Helpers
  hasError<K extends keyof T>(key: K, errorType?: string): boolean;
  getError<K extends keyof T>(key: K, errorType: string): ValidationError | undefined;
  getRawValues(): T;
}

// Tipo para el builder
export interface ISignalFormBuilder<T extends Record<string, any>> {
  addField<K extends keyof T>(key: K, config: Omit<FieldConfig<T[K]>, 'key'>): SignalFormBuilder<T>;
  setValidateOnChange(value: boolean): SignalFormBuilder<T>;
  setValidateOnBlur(value: boolean): SignalFormBuilder<T>;
  setDebounceTime(ms: number): SignalFormBuilder<T>;
  build(): SignalForm<T>;
}

