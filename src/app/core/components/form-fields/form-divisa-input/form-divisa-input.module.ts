import { forwardRef, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDivisaInputComponent } from './form-divisa-input.component';
import { DropdownModule } from 'primeng/dropdown';
import { DirectivesModule } from '../../../../core/directive/directives.module';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ImgModule } from '../../../../admin/components/img-component/img.module';

@NgModule({
  declarations: [FormDivisaInputComponent],
  imports: [CommonModule, DropdownModule, DirectivesModule, FormsModule, ImgModule],
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
