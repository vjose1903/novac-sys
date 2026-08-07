import { Directive, ElementRef, EventEmitter, HostListener, Input, Optional, Output, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { fun } from '@services/functions.service';

@Directive({
  selector: '[appNumeroFormato]',
  standalone: false,
})
export class NumeroFormatoDirective {
  @Input() decimals: number | string = 2;
  @Output() appNumeroFormatoBlur = new EventEmitter<string>();

  constructor(@Optional() @Self() private ngControl: NgControl, private element: ElementRef<HTMLInputElement>) {}

  @HostListener('focus')
  onFocus() {
    const input = this.element.nativeElement;
    if (input.readOnly) return;
    if (input.value.trim() !== '' && Number(input.value) === 0) {
      input.value = '';
      return;
    }
    input.value = this.toPlain(input.value);
    input.select();
  }

  @HostListener('blur')
  onBlur() {
    const input = this.element.nativeElement;
    if (input.readOnly) return;

    let value: string;
    if (input.value.trim() === '') {
      value = this.decimalsCount > 0 ? '0.00' : '0';
    } else if (isNaN(fun.desformatearStNumber(input.value))) {
      fun.toastError('Valor introducido es invalido', 'ERROR');
      input.focus();
      return;
    } else {
      value = fun.roundNumberToDecimal(input.value, this.decimalsCount);
    }

    input.value = value;
    this.writeValue(value);
    this.appNumeroFormatoBlur.emit(value);
  }

  private get decimalsCount() {
    const parsed = Number(this.decimals);
    return this.decimals === '' || this.decimals == null || isNaN(parsed) ? 2 : parsed;
  }

  private writeValue(value: string) {
    this.ngControl?.control?.setValue(value, { emitEvent: false });
  }

  private toPlain(value: string) {
    if (fun.isEmpty(value)) return '';
    const number = fun.desformatearStNumber(value);
    return isNaN(number) ? value : String(number);
  }
}
