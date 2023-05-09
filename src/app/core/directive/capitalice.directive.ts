import { fun } from './../services/functions.service';
import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appCapitalice]',
})
export class CapitaliceDirective {
  @Input('appCapitalice') type: 'formGroup' | 'input';

  constructor(private element: ElementRef) {}
  @HostListener('focusin', ['$event'])
  @HostListener('input', ['$event.target.value'])
  onInput(value) {
    this.capitalice();
  }

  capitalice() {
    setTimeout(() => {
      this.element.nativeElement.value = fun.capitalice(this.element.nativeElement.value);
    }, 1);
  }
}
