import { NgControl } from '@angular/forms';
import { IAutoCompleteConfig, IAutoCompleteBtnNewOption } from './form-auto-complete.utils';
import { Component, computed, EventEmitter, input, model, OnChanges, OnInit, Optional, Output, Self, signal, SimpleChanges } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { customFormsElements } from '@core/typescript/custom-forms-elements/custom-forms-elements';

@Component({
  selector: 'form-auto-complete',
  templateUrl: './form-auto-complete.component.html',
  styleUrl: './form-auto-complete.component.scss',
  standalone: false,
})
export class FormAutoCompleteComponent extends customFormsElements implements OnInit, OnChanges {
  suggestions = input<any[]>([]);
  newOptionValue = signal<any>('');

  config = model.required<IAutoCompleteConfig>();
  multiple = input.required<boolean>();

  hasValue = fun.hasValue;
  getProperty = fun.getProperty;

  @Output() keydownEnter = new EventEmitter();

  filteredSuggestions = computed(() =>
    this.suggestions().filter((item: any) => {
      const keyLabel = this.config().keyLabel;

      const normalizedItem = fun.normalizeWord(item?.[keyLabel]);
      const normalizedItemName = fun.normalizeWord(this.newOptionValue());

      return normalizedItem?.toLowerCase().includes(normalizedItemName.toLowerCase());
    })
  );

  constructor(@Optional() @Self() public control: NgControl) {
    super(control);
  }

  ngOnInit(): void {
    if (this.control) {
      this.fieldName.set(`${this.control.name}`);
      this.formGroup.set(this.control['_parent'].form);
      this.config.update(value => ({ ...value, fieldId: `autoComplete-${this.fieldName()}` }));
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('config' in changes) this.verificateConfig();
  }

  verificateConfig() {
    if (fun.isEmpty(this.config().canCreateNewOptions)) this.config.update(value => ({ ...value, canCreateNewOptions: false }));
  }

  onCreateAutoCompleteOption(btn: IAutoCompleteBtnNewOption) {}

  setNewOptionValue(itemName: string): void {
    this.newOptionValue.set(itemName.replace(/\s+/g, ' ').trim());
  }

  returnValue(value: any) {
    const config = this.config();
    const keyValue = config.keyValue;

    if (fun.hasValue(keyValue) && fun.hasValue(value)) {
      const isMultiple = this.multiple();

      if (isMultiple) value = value.map(item => (fun.isPrimitive(item) ? item : item[keyValue]));
      else value = value[keyValue];
    }

    this.onChange(value);
    this.writeValue(value);
  }

  emitKeydown(event: any) {
    this.keydownEnter.emit(event);
  }

  test(item, prop) {}
}
