import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  // tslint:disable:directive-selector
  selector: '[compare]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: PaswordConfirmDirective,
      multi: true,
    },
  ],
})
export class PaswordConfirmDirective {
  @Input('compare') appConfirmPassword: string;

  validate(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value.length === 0) {
      return null;
    }

    const controlToCompare = control.root.get(this.appConfirmPassword);
    if (controlToCompare) {
      const subscription: Subscription = controlToCompare.valueChanges.subscribe(() => {
        control.updateValueAndValidity();
        subscription.unsubscribe();
      });
    }
    return controlToCompare && controlToCompare.value !== control.value ? { compares: true } : null;
  }
}
