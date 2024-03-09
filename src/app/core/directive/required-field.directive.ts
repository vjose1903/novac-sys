import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { fun } from '../services/functions.service';

@Directive({
  selector: '[requiredFieldLabel]',
})
export class RequiredFieldDirective implements OnInit {
  @Input('requiredFieldLabel') show: boolean | string = true;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    if (fun.isEmpty(this.show)) this.show = true;
    if (this.show == true) this.el.nativeElement.classList.add('required-field-label');
  }
}
