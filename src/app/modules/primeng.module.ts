import { NgModule } from '@angular/core';
import { SidebarModule } from 'primeng/sidebar';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';

const modulos = [DialogModule, ProgressBarModule, SidebarModule, TooltipModule];
@NgModule({
  declarations: [],
  imports: [CommonModule, ...modulos],
  exports: modulos,
})
export class PrimengModule {}
