import { Injectable } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { fun } from './functions.service';
import { Dropdown } from 'primeng/dropdown';

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

  getValue(event: any) {
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
    const valueTimmed = value.trim();

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

  showPDropdown(event: any, dropdown: Dropdown) {
    if (fun.hasValue(event.relatedTarget)) setTimeout(() => dropdown.show(), 100);
  }
}
