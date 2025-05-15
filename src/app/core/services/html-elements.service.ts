import { Injectable } from '@angular/core';

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
}
