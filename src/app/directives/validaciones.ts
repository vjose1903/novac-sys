import { AbstractControl } from '@angular/forms';
import { Directive } from '@angular/core';

// tslint:disable-next-line: directive-selector
@Directive({
  selector: '[sin-Rayas]',
  standalone: false,
})
// tslint:disable-next-line: directive-class-suffix
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
