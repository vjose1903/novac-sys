import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, input, OnInit, Optional, Output, Self } from '@angular/core';
import { FormsModule, NgControl, ReactiveFormsModule } from '@angular/forms';
import { HtmlElementsService } from '@core/services/html-elements.service';
import { ImagenService } from '@core/services/imagen.service';
import { customFormsElements } from '@core/typescript/custom-forms-elements/custom-forms-elements';
import { dropdownFilterFocusInput } from '@core/typescript/p-dropdown.utils';
import { DivisaService } from '@registros/divisa/divisa.service';
import { fun } from '@services/functions.service';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'cuenta-contable-select',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SelectModule],
  templateUrl: './form-cuenta-contable-select.component.html',
  styleUrl: './form-cuenta-contable-select.component.scss',
})
export class FormCuentaContableSelectComponent extends customFormsElements implements OnInit {
  label = input<string>('');
  inputId = input<string>('');
  options = input<any[]>([]);

  fun = fun;
  hasValue = fun.hasValue;
  getProperty = fun.getProperty;

  @Output() keydownEnter = new EventEmitter();
  @Output() onChangeValue = new EventEmitter();
  @Output() onHide = new EventEmitter();

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
    this.onChangeValue.emit(value);
  }

  emitKeydown(event: any) {
    this.keydownEnter.emit(event);
  }

  emitHide(event: any) {
    this.onHide.emit(event);
  }

  dropCuentaFocus(drop) {
    dropdownFilterFocusInput(drop);
  }
}
