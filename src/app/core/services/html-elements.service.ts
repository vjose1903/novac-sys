import { AbstractControl, FormControl } from '@angular/forms';
import { fun } from './functions.service';
import { Select } from 'primeng/select';
import { ElementRef, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HtmlElementsService {
  constructor() {}

  selectValue(event: any) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement) inputElement.select();
  }

  getId(event: any) {
    const inputElement = event.target as HTMLInputElement;
    return inputElement ? inputElement.id : '';
  }

  getValue(event: any): any {
    const inputElement = event.target as HTMLInputElement;
    return inputElement ? inputElement.value : null;
  }

  selectAndConvertToNumber(event: any, control?: FormControl | AbstractControl<any, any>) {
    const inputElement = event.target as HTMLInputElement;

    const value = fun.hasValue(control) ? control.value : inputElement.value;
    const numberValue = fun.desformatearStNumber(value);

    if (fun.hasValue(control)) control.setValue(numberValue);
    else inputElement.value = numberValue;

    if (inputElement) inputElement.select();
  }

  formatInputNumber(event: any, control?: FormControl | AbstractControl<any, any>) {
    const inputElement = event.target as HTMLInputElement;

    const value = fun.hasValue(control) ? control.value : inputElement.value;
    const stNumberValue = fun.parseStFloatTwoDecimals(value);

    if (fun.hasValue(control)) control.setValue(stNumberValue);
    else inputElement.value = stNumberValue;
  }

  trimValue(event: any, control?: FormControl | AbstractControl<any, any>) {
    const inputElement = event.target as HTMLInputElement;

    const value = fun.hasValue(control) ? control.value : inputElement.value;
    const valueTimmed = value?.trim() ?? '';

    if (fun.hasValue(control)) control.setValue(valueTimmed);
    else inputElement.value = valueTimmed;
  }

  trimStartValue(event: any, control?: FormControl | AbstractControl<any, any>) {
    const inputElement = event.target as HTMLInputElement;

    const value = fun.hasValue(control) ? control.value : inputElement.value;
    const valueTimmed = value.trimStart();

    if (fun.hasValue(control)) control.setValue(valueTimmed);
    else inputElement.value = valueTimmed;
  }

  focusInput(event: any | ElementRef): any {
    const inputElement = event instanceof ElementRef ? event.nativeElement : (event.target as HTMLInputElement);

    if (inputElement) inputElement.focus();
  }

  showPSelectPanel(event, dropdown) {
    fun.setTimeout(() => {
      if (event.type == 'focus' && !dropdown.overlayVisible) {
        console.log('event ', event);
        console.log('dropdown ', dropdown);
        requestAnimationFrame(() => {
          dropdown.show();
        });
      }
    }, 10);
  }
}
