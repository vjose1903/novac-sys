import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { fun } from '../services/functions.service';

@Directive({
  selector: '[appUppercase]',
})
export class UppercaseDirective {
  @Input('appUppercase') type: 'condition' | 'always';
  @Input() condition: boolean | undefined | null;

  constructor(private element: ElementRef) {}
  @HostListener('focusin', ['$event'])
  @HostListener('input', ['$event.target.value'])
  onInput(value) {
    this.uppercase();
  }

  uppercase() {
    setTimeout(() => {
      if (fun.isEmpty(this.condition) || (fun.hasValue(this.condition) && this.condition)) {
        this.element.nativeElement.value = fun.uppercase(this.element.nativeElement.value);
      }
    }, 1);
  }
}
