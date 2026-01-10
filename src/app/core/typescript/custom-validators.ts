import { AbstractControl, ValidatorFn } from '@angular/forms';
import { validate } from '@angular/forms/signals';
import { fun } from '../services/functions.service';
import { Ss } from '../services/singleton.service';

/** Tipo para el retorno de validadores de Signal Forms */
type SignalValidatorResult = { kind: string; message: string } | undefined;

export class customValidators {
  constructor() {}

  // ==================== REACTIVE FORMS ====================

  cedulaValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      let is_correct = false;
      if (!control.value?.endsWith('_')) {
        const docSinGuiones = control.value?.split('-').join('') ?? '';
        if (fun.ValidaCedula(docSinGuiones)) is_correct = true;
      }
      return is_correct ? null : { invalidCedula: { value: control.value } };
    };
  }

  ValidateRayaAbajo(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (control.value === null) return null;
      if (control.value.indexOf('_') >= 0) return { sinRayas: true };
      return null;
    };
  }

  // ==================== SIGNAL FORMS ====================

  /** Validador de cédula para Signal Forms - usar con validate() */
  static signalCedulaValidator(schemaField: any): void {
    validate(schemaField, ({ value }) => {
      const cedula = value() as string | null;
      if (!cedula) return undefined; // Si no hay valor, que lo maneje required()
      if (cedula.includes('_')) return { kind: 'invalidCedula', message: 'Cédula incompleta' };
      const cedulaSinGuiones = cedula.split('-').join('');
      if (!fun.ValidaCedula(cedulaSinGuiones)) return { kind: 'invalidCedula', message: 'Cédula inválida' };
      return undefined;
    });
  }

  /** Validador de guiones bajos para Signal Forms - usar con validate() */
  static signalValidateRayaAbajo(schemaField: any): void {
    validate(schemaField, ({ value }) => {
      const val = value() as string | null;
      if (val === null) return undefined;
      if (val.includes('_')) return { kind: 'sinRayas', message: 'Complete el campo' };
      return undefined;
    });
  }
}
