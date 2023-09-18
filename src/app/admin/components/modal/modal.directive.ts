import { Directive, Input, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appModal]',
})
export class ModalDirective {
  @Input('appModal') modalId;

  constructor(public viewContainerRef: ViewContainerRef) {}
}
