import { Directive, Input, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appModal]',
})
export class ModalDirective {
  @Input('appModal') modal_id;

  constructor(public viewContainerRef: ViewContainerRef) {}
}
