import { Directive, Input, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[modalReceptorId]',
  standalone: true,
})
<<<<<<< HEAD:src/app/admin/components/modal/modal.directive.ts
export class ModalDirective {
  @Input('appModal') modalId;
=======
export class DynamicModalDirective {
  @Input('modalReceptorId') modalReceptorId!: string;
>>>>>>> dev:src/app/core/components/dynamic-modal/dynamic-modal.directive.ts

  constructor(public viewContainerRef: ViewContainerRef) {}
}

