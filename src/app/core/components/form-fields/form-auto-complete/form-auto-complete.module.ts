import { forwardRef, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormAutoCompleteComponent } from './form-auto-complete.component';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule, ReactiveFormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DirectivesModule } from '../../../directive/directives.module';
import { FormErrorMsgComponent } from '@core/components/form-error-msg/form-error-msg.component';

@NgModule({
  declarations: [FormAutoCompleteComponent],
  imports: [CommonModule, AutoCompleteModule, FormsModule, ReactiveFormsModule, DirectivesModule, FormErrorMsgComponent],
  exports: [FormAutoCompleteComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormAutoCompleteComponent),
      multi: true,
    },
  ],
})
export class FormAutoCompleteModule {}
