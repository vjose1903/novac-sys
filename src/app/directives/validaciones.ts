import { AbstractControl } from '@angular/forms';
import { Directive } from '@angular/core';

@Directive({ selector: '[sin-Rayas]' })
export class ValidateRayaAbajo {
  static verificarRayaAbajo(c: AbstractControl) {
    if (c.value === null) {
      return null;
    }
    if (c.value.indexOf('_') >= 0) {
      return { sinRayas: true };
    }
    return null;
  }
}
