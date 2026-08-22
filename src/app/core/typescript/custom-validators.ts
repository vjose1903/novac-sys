import { AbstractControl, ValidatorFn } from '@angular/forms';
import { fun } from '../services/functions.service';
import { Ss } from '../services/singleton.service';

export class customValidators {
  constructor() {}

  cedulaValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      let is_correct = false;
      if (!fun.endsWith(control.value, '_')) {
        const docSinGuiones = fun.join(fun.split(control.value, '-'), '');

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
}
