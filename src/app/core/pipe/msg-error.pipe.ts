import { Pipe, PipeTransform } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Pipe({
  name: 'msgError',
})
export class MsgErrorPipe implements PipeTransform {
  transform(formControl: UntypedFormGroup): unknown {
    const errors = formControl.errors;

    let msg = '';

    if (errors.required) msg = 'Este campo es requerido.';
    else if (errors.minlength) msg = `Cant. mínima de letras es: ${errors.minlength.requiredLength}.`;
    else if (errors.ip) msg = `Intoduzca una ip valida.`;
    else if (errors.compares) msg = `Las contraseñas no coinciden.`;
    else if (errors.invalidCedula) msg = `Ingrese una cedula válida.`;

    return msg;
  }
}
