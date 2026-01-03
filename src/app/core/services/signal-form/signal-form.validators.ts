import { ValidationError, ValidatorFn } from './signal-form.types';

export class SignalFormValidators {
  static required<T>(message = 'Este campo es requerido'): ValidatorFn<T> {
    return (value: T): ValidationError | null => {
      const isEmpty = value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
      return isEmpty ? { type: 'required', message } : null;
    };
  }

  static minLength(min: number, message?: string): ValidatorFn<string> {
    return (value: string): ValidationError | null => {
      if (!value) return null;
      return value.length < min ? { type: 'minLength', message: message || `Mínimo ${min} caracteres`, min, actual: value.length } : null;
    };
  }

  static maxLength(max: number, message?: string): ValidatorFn<string> {
    return (value: string): ValidationError | null => {
      if (!value) return null;
      return value.length > max ? { type: 'maxLength', message: message || `Máximo ${max} caracteres`, max, actual: value.length } : null;
    };
  }

  static min(min: number, message?: string): ValidatorFn<number> {
    return (value: number): ValidationError | null => {
      if (value === null || value === undefined) return null;
      return value < min ? { type: 'min', message: message || `El valor mínimo es ${min}`, min, actual: value } : null;
    };
  }

  static max(max: number, message?: string): ValidatorFn<number> {
    return (value: number): ValidationError | null => {
      if (value === null || value === undefined) return null;
      return value > max ? { type: 'max', message: message || `El valor máximo es ${max}`, max, actual: value } : null;
    };
  }

  static pattern(regex: RegExp, message = 'Formato inválido'): ValidatorFn<string> {
    return (value: string): ValidationError | null => {
      if (!value) return null;
      return !regex.test(value) ? { type: 'pattern', message, pattern: regex.toString() } : null;
    };
  }

  static email(message = 'Email inválido'): ValidatorFn<string> {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return SignalFormValidators.pattern(emailRegex, message);
  }

  static numeric(message = 'Solo se permiten números'): ValidatorFn<string> {
    return SignalFormValidators.pattern(/^\d+$/, message);
  }

  static alphanumeric(message = 'Solo se permiten letras y números'): ValidatorFn<string> {
    return SignalFormValidators.pattern(/^[a-zA-Z0-9]+$/, message);
  }

  static range(min: number, max: number, message?: string): ValidatorFn<number> {
    return (value: number): ValidationError | null => {
      if (value === null || value === undefined) return null;
      const isOutOfRange = value < min || value > max;
      return isOutOfRange ? { type: 'range', message: message || `El valor debe estar entre ${min} y ${max}`, min, max, actual: value } : null;
    };
  }

  static custom<T>(validatorFn: (value: T) => boolean, message: string, errorType = 'custom'): ValidatorFn<T> {
    return (value: T): ValidationError | null => {
      return !validatorFn(value) ? { type: errorType, message } : null;
    };
  }

  static compose<T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> {
    return (value: T): ValidationError | null => {
      for (const validator of validators) {
        const error = validator(value);
        if (error) return error;
      }
      return null;
    };
  }

  static composeAll<T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> {
    return (value: T): ValidationError | null => {
      const errors: ValidationError[] = [];
      for (const validator of validators) {
        const error = validator(value);
        if (error) errors.push(error);
      }
      return errors.length > 0 ? { type: 'multiple', message: errors.map(e => e.message).join(', '), errors } : null;
    };
  }

  static requiredIf<T>(condition: () => boolean, message = 'Este campo es requerido'): ValidatorFn<T> {
    return (value: T): ValidationError | null => {
      if (!condition()) return null;
      return SignalFormValidators.required<T>(message)(value);
    };
  }

  static matches<T>(fieldGetter: () => T, message = 'Los campos no coinciden'): ValidatorFn<T> {
    return (value: T): ValidationError | null => {
      return value !== fieldGetter() ? { type: 'matches', message } : null;
    };
  }
}

