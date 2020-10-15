import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';

@NgModule({
  declarations: [],
  imports: [CommonModule, DialogModule, ProgressBarModule],
  exports: [DialogModule, ProgressBarModule],
})
export class PrimengModule {}
