import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewModalComponent } from './modal.component';
import { ModalDirective } from './modal.directive';
import { DialogModule } from 'primeng/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [NewModalComponent, ModalDirective],
  imports: [CommonModule, DialogModule, FormsModule, ReactiveFormsModule],
  exports: [NewModalComponent],
})
export class NewModalModule {}
