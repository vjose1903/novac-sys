import { fun } from './../services/functions.service';
import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appCapitalice]',
  standalone: false,
})
export class CapitaliceDirective {
  @Input('appCapitalice') type: 'formGroup' | 'input';

  constructor(private element: ElementRef) {}
  @HostListener('focusin')
  @HostListener('input')
  onInput() {
    this.capitalice();
  }

  capitalice() {
    setTimeout(() => {
      const input = this.element.nativeElement;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.value = fun.capitalice(input.value);
      input.setSelectionRange(start, end);
    }, 1);
  }
}
