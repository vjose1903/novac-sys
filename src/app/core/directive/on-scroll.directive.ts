import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
    selector: '[appOnScroll]',
    standalone: false
})
export class OnScrollDirective {
  @Output() scrolling = new EventEmitter<any>();

  constructor() {}

  @HostListener('scroll', ['$event'])
  onScroll(e) {
    this.scrolling.emit({ element: e.target, event: e, element_id: e?.target?.id });
  }
}
