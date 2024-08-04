import { FormControl, NgControl } from '@angular/forms';
import { IAutoCompleteConfig, IAutoCompleteBtnNewOption } from './form-auto-complete.utils';
import { Component, computed, input, model, OnInit, Optional, Self, signal } from '@angular/core';
import { fun } from '../../services/functions.service';
import { customFormsElements } from '../../typescript/custom-forms-elements/custom-forms-elements';

@Component({
  selector: 'form-auto-complete',
  templateUrl: './form-auto-complete.component.html',
  styleUrl: './form-auto-complete.component.scss',
})
export class FormAutoCompleteComponent extends customFormsElements implements OnInit {
  suggestions = input<any[]>([]);
  field = input<string>('');
  newOptionValue = signal<any>('');

  config = input.required<IAutoCompleteConfig>();
  multiple = input.required<boolean>();

  hasValue = fun.hasValue;
  getProperty = fun.getProperty;

  filteredSuggestions = computed(() =>
    this.suggestions().filter((item: any) => {
      const keyLabel = this.config().keyLabel;

      const normalizedItem = fun.normalizeWord(item?.[keyLabel]);
      const normalizedItemName = fun.normalizeWord(this.newOptionValue());

      return normalizedItem?.toLowerCase().includes(normalizedItemName.toLowerCase());
    }),
  );

  constructor(@Optional() @Self() public control: NgControl) {
    super(control);
  }

  ngOnInit(): void {
    if (this.control) {
      this.fieldName.set(`${this.control.name}`);
      this.formGroup.set(this.control['_parent'].form);
    }
  }

  onCreateAutoCompleteOption(config: IAutoCompleteConfig, btn: IAutoCompleteBtnNewOption) {
    // if (config.processNewOption) {
    //   const formulario = this.formService.formGroup.getRawValue();
    //   const newOption = config.processNewOption(config, btn);
    //   if (this.isAutoCompleteSelected(newOption, config, formulario)) {
    //     fun.toastWarning('Opción ya agregada para esta indicación.', 'Elemento ya seleccionado');
    //   } else {
    //     const currentFieldValue = this.formService.formGroup.controls[config.formFieldName].value;
    //     currentFieldValue.push(newOption);
    //     this.formService.formGroup.controls[config.formFieldName].setValue(currentFieldValue);
    //     this.onAutoCompleteSelected(newOption, config);
    //   }
    // }
  }

  setNewOptionValue(itemName: string): void {
    this.newOptionValue.set(itemName.replace(/\s+/g, ' ').trim());
  }

  returnValue(value: any) {
    const config = this.config();
    const keyValue = config.keyValue;

    if (fun.hasValue(keyValue) && fun.hasValue(value)) {
      const isMultiple = this.multiple();

      if (isMultiple) value = value.map((item) => (fun.isPrimitive(item) ? item : item[keyValue]));
      else value = value[keyValue];
    }

    this.onChange(value);
  }

  test(item, prop) {}
}
