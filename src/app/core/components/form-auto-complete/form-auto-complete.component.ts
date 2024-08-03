import { ControlValueAccessor, FormGroup, NgControl } from '@angular/forms';
import { IAutoCompleteConfig, IAutoCompleteBtnNewOption } from './form-auto-complete.utils';
import { Component, computed, input, OnInit, Optional, Self, signal } from '@angular/core';
import { fun } from '../../services/functions.service';

@Component({
  selector: 'form-auto-complete',
  templateUrl: './form-auto-complete.component.html',
  styleUrl: './form-auto-complete.component.scss',
})
export class FormAutoCompleteComponent implements OnInit, ControlValueAccessor {
  suggestions = input<any[]>([]);
  field = input<string>('');

  valueSignal = signal<any>(undefined);
  isDisabledSignal = signal<boolean>(false);

  newOptionValue = signal<any>('');

  filteredSuggestions = computed(() =>
    this.suggestions().filter((item: any) => {
      const keyLabel = this.config().keyLabel;

      const normalizedItem = fun.normalizeWord(item?.[keyLabel]);
      const normalizedItemName = fun.normalizeWord(this.newOptionValue());

      return normalizedItem?.toLowerCase().includes(normalizedItemName.toLowerCase());
    }),
  );

  fieldName = signal<string>('');
  formGroup = signal<FormGroup>(null);
  config = input.required<IAutoCompleteConfig>();
  multiple = input.required<boolean>();

  onChange: any = () => {};
  onTouched: any = () => {};

  hasValue = fun.hasValue;

  constructor(@Optional() @Self() public control: NgControl) {
    if (this.control) this.control.valueAccessor = this;
  }

  ngOnInit(): void {
    if (this.control) {
      this.fieldName.set(`${this.control.name}`);
      this.formGroup.set(this.control['_parent'].form);
    }
  }

  writeValue(value: any): void {
    this.valueSignal.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabledSignal.set(isDisabled);
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

  async onAutoCompleteSelected(selectEvent: any) {
    if (selectEvent && selectEvent.value) {
      this.valueSignal.update((currentValue) => {
        currentValue ??= [];
        const newValue = fun.hasValue(this.config().keyValue) ? selectEvent.value[this.config().keyValue] : selectEvent.value;

        return this.multiple() ? [...currentValue, newValue] : newValue;
      });

      this.onChange(this.valueSignal());
      this.onTouched();
    }

    // try {
    //   if (autoCompleteInfo.processData) {
    //     this.formService.formGroup.controls[autoCompleteInfo.formFieldName].setValue(autoCompleteInfo.processData(autoCompleteInfo));
    //   }
    //   resolve(true);
    // } catch (error) {
    //   console.error(error);
    //   reject();
    // }
  }

  onDeleteAutoCompleteOption(arg: any): void {}

  setNewOptionValue(itemName: string): void {
    this.newOptionValue.set(itemName.replace(/\s+/g, ' ').trim());
  }
}
