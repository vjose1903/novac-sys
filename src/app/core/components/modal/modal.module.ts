import { PrimengModule } from './../../../modules/primeng.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewModalComponent } from './modal.component';
import { ModalDirective } from './modal.directive';
import { DialogModule } from 'primeng/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormErrorMsgComponent } from '../form-error-msg/form-error-msg.component';

@NgModule({
  declarations: [NewModalComponent, ModalDirective],
  imports: [CommonModule, DialogModule, FormsModule, ReactiveFormsModule, PrimengModule, FormErrorMsgComponent],
  exports: [NewModalComponent],
})
export class NewModalModule {}
