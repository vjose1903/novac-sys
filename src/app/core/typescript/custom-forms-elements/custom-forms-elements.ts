import { ControlValueAccessor, FormControl, FormGroup, NgControl } from '@angular/forms';
import { signal } from '@angular/core';

export class customFormsElements implements ControlValueAccessor {
  fieldName = signal<string>('');

  formGroup = signal<FormGroup>(null as any);
  disabled = signal<boolean>(false);

  valueSignal = signal<any>(undefined);

  onChange: any = () => {};
  onTouched: any = () => {};

  constructor(public control: NgControl) {
    if (this.control) this.control.valueAccessor = this;
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

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  getControlClass() {
    if (this.control && this.control.control) {
      const control = this.control.control;
      let classes = '';

      if (control.touched) classes += ' ng-touched';
      if (control.invalid) classes += ' ng-invalid';
      if (control.pristine) classes += ' ng-pristine';
      if (control.dirty) classes += ' ng-dirty';

      return classes;
    }

    return '';
  }
}
