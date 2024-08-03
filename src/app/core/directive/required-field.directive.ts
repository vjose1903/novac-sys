import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { fun } from '../services/functions.service';

@Directive({
  selector: '[requiredFieldLabel]',
})
export class RequiredFieldDirective implements OnInit, OnChanges {
  @Input('requiredFieldLabel') show: boolean | string = true;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    if (fun.isEmpty(this.show)) this.show = true;
    this.verificateRequiredField();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('show' in changes) this.verificateRequiredField();
  }

  verificateRequiredField() {
    
    if (this.show == true) this.el.nativeElement.classList.add('required-field-label');
    else this.el.nativeElement.classList.remove('required-field-label')
  }
}
