import { Pipe, PipeTransform } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { fun } from '../services/functions.service';

@Pipe({
  name: 'capitalice',
})
export class CapitalicePipe implements PipeTransform {
  transform(text: string, form?: UntypedFormGroup, formControlName?: string): unknown {
    if (fun.hasValue(form)) {
      const campo = form.get(formControlName);
      campo.setValue(fun.capitalice(text));
    } else {
      return fun.capitalice(text);
    }
  }
}
