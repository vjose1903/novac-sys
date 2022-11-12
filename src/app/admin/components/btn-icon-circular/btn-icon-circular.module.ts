import { PrimengModule } from '../../../modules/primeng.module';
import { BtnIconCircularComponent } from './btn-icon-circular.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [BtnIconCircularComponent],
  imports: [CommonModule, PrimengModule],
  exports: [BtnIconCircularComponent],
})
export class BtnIconModule {}
