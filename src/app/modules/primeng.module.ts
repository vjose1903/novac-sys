import { NgModule } from '@angular/core';
import { SidebarModule } from 'primeng/sidebar';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';

const modulos = [DialogModule, ProgressBarModule, SidebarModule];
@NgModule({
  declarations: [],
  imports: [CommonModule, ...modulos],
  exports: modulos,
})
export class PrimengModule {}
