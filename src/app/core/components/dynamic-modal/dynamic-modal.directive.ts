import { Directive, Input, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[modalReceptorId]',
  standalone: true,
})
export class DynamicModalDirective {
  @Input('modalReceptorId') modalReceptorId!: string;

  constructor(public viewContainerRef: ViewContainerRef) {}
}
