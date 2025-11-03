import { Component, EventEmitter, input, Optional, Self, OnInit, Output, signal, inject } from '@angular/core';
import { customFormsElements } from '@core/typescript/custom-forms-elements/custom-forms-elements';
import { fun } from '@services/functions.service';
import { NgControl } from '@angular/forms';
import { DivisaService } from '@admin/registros/divisa/divisa.service';
import { HtmlElementsService } from '@services/html-elements.service';
import { ImagenService } from '@services/imagen.service';

@Component({
  selector: 'form-divisa-input',
  templateUrl: './form-divisa-input.component.html',
  styleUrl: './form-divisa-input.component.scss',
  standalone: false,
})
export class FormDivisaInputComponent extends customFormsElements implements OnInit {
  inputId = input<string>('');

  fun = fun;
  hasValue = fun.hasValue;
  getProperty = fun.getProperty;

  @Output() keydownEnter = new EventEmitter();
  @Output() onChangeValue = new EventEmitter();

  divisaServ = inject(DivisaService);
  htmlServ = inject(HtmlElementsService);
  imgServ = inject(ImagenService);

  constructor(@Optional() @Self() public control: NgControl) {
    super(control);
  }

  ngOnInit(): void {
    if (this.control) {
      this.fieldName.set(`${this.control.name}`);
      this.formGroup.set(this.control['_parent'].form);
    }
  }

  returnValue(value: any) {
    this.onChange(value);
    this.writeValue(value);
    this.onChangeValue.emit(value)
  }



  emitKeydown(event: any) {
    this.keydownEnter.emit(event);
  }
}
