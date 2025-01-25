import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appResizeEvent]',
  standalone: false
})
export class ResizeEventDirective {
  @Output() resized = new EventEmitter<any>();

  constructor() {}

  @HostListener('window:resize', ['$event'])
  onResize(event) {

    event.target.innerWidth;


  }
}
