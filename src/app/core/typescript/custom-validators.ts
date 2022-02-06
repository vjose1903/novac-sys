import { AbstractControl, ValidatorFn } from '@angular/forms';
import { FunctionService } from '../services/functions.service';
import * as _ from 'lodash';
import { GLOBAL } from './GLOBAL';

export class customValidators {
  constructor() {}

  cedulaValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      let is_correct = false;
      if (!_.endsWith(control.value, '_')) {
        const docSinGuiones = _.join(_.split(control.value, '-'), '');

        if (GLOBAL.ValidaCedula(docSinGuiones)) is_correct = true;
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
