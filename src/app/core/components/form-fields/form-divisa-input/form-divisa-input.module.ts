import { forwardRef, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDivisaInputComponent } from './form-divisa-input.component';
import { DirectivesModule } from '../../../../core/directive/directives.module';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ImgModule } from '@components/img-component/img.module';
import { SelectModule } from 'primeng/select';

@NgModule({
  declarations: [FormDivisaInputComponent],
  imports: [CommonModule, SelectModule, DirectivesModule, FormsModule, ImgModule],
  exports: [FormDivisaInputComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormDivisaInputComponent),
      multi: true,
    },
  ],
})
export class FormDivisaInputModule {}
