import { Directive, ElementRef, EventEmitter, HostListener, Input, Optional, Output, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { fun } from '@services/functions.service';

@Directive({
  selector: '[appNumeroFormato]',
  standalone: false,
})
export class NumeroFormatoDirective {
  @Input() decimals: number | string = 2;
  @Input() formatOnInput: boolean | string = true;
  @Output() appNumeroFormatoBlur = new EventEmitter<string>();
  private inputFormatTimer?: ReturnType<typeof setTimeout>;

  constructor(@Optional() @Self() private ngControl: NgControl, private element: ElementRef<HTMLInputElement>) {}

  @HostListener('input')
  onInput() {
    const input = this.element.nativeElement;
    if (input.readOnly || !this.formatsOnInput) return;

    clearTimeout(this.inputFormatTimer);
    this.inputFormatTimer = setTimeout(() => this.formatInputValue(input), 0);
  }

  private formatInputValue(input: HTMLInputElement) {
    if (input.readOnly || !this.formatsOnInput) return;

    const rawValue = input.value;
    const caretPosition = input.selectionStart ?? rawValue.length;
    const formattedValue = this.formatWhileTyping(rawValue);

    if (formattedValue === rawValue) {
      this.writeValue(formattedValue);
      return;
    }

    input.value = formattedValue;
    this.writeValue(formattedValue);

    const nextCaretPosition = this.getFormattedCaret(rawValue, caretPosition, formattedValue);
    try {
      input.setSelectionRange(nextCaretPosition, nextCaretPosition);
    } catch {
      // Algunos inputs no permiten restaurar el cursor mientras Angular actualiza el valor.
    }
  }

  @HostListener('focus')
  onFocus() {
    const input = this.element.nativeElement;
    if (input.readOnly) return;
    if (input.value.trim() !== '' && Number(input.value) === 0) {
      input.value = '';
      return;
    }
    if (this.formatsOnInput) {
      input.select();
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

  private get formatsOnInput() {
    return this.formatOnInput !== false && this.formatOnInput !== 'false';
  }

  private writeValue(value: string) {
    this.ngControl?.control?.setValue(value, { emitEvent: false });
  }

  private toPlain(value: string) {
    if (fun.isEmpty(value)) return '';
    const number = fun.desformatearStNumber(value);
    return isNaN(number) ? value : String(number);
  }

  private formatWhileTyping(value: string) {
    if (value === '') return '';

    const normalizedValue = value.replaceAll(',', '');
    const isNegative = normalizedValue.startsWith('-');
    const unsignedValue = normalizedValue.replace(/-/g, '').replace(/[^\d.]/g, '');
    const decimalIndex = unsignedValue.indexOf('.');
    let hasDecimalSeparator = decimalIndex >= 0;
    let integerPart = hasDecimalSeparator ? unsignedValue.slice(0, decimalIndex) : unsignedValue;
    let decimalPart = hasDecimalSeparator ? unsignedValue.slice(decimalIndex + 1).replace(/\./g, '') : '';

    if (this.decimalsCount === 0) {
      hasDecimalSeparator = false;
      decimalPart = '';
    } else {
      decimalPart = decimalPart.slice(0, this.decimalsCount);
    }

    if (integerPart === '' && decimalPart === '' && !hasDecimalSeparator) {
      return isNegative ? '-' : '';
    }

    integerPart = integerPart === '' ? '0' : integerPart;
    integerPart = integerPart.replace(/^0+(?=\d)/, '');
    const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return `${isNegative ? '-' : ''}${groupedInteger}${hasDecimalSeparator ? `.${decimalPart}` : ''}`;
  }

  private getFormattedCaret(rawValue: string, caretPosition: number, formattedValue: string) {
    const normalizedBeforeCaret = rawValue.slice(0, caretPosition).replaceAll(',', '');
    let meaningfulCharacters = (normalizedBeforeCaret.match(/[\d.\-]/g) ?? []).length;

    if (caretPosition > 0 && /^-?\./.test(rawValue.replaceAll(',', ''))) {
      meaningfulCharacters += 1;
    }

    if (meaningfulCharacters === 0) return 0;

    let seenCharacters = 0;
    for (let index = 0; index < formattedValue.length; index += 1) {
      if (/[\d.\-]/.test(formattedValue[index])) {
        seenCharacters += 1;
        if (seenCharacters === meaningfulCharacters) return index + 1;
      }
    }

    return formattedValue.length;
  }
}
