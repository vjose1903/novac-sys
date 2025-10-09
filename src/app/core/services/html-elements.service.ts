import { ElementRef, Injectable } from '@angular/core';
import { fun } from './functions.service';

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
