import { NgModule } from '@angular/core';
import { SidebarModule } from 'primeng/sidebar';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { InputMaskModule } from 'primeng/inputmask';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanelModule } from 'primeng/overlaypanel';

const modulos = [DialogModule, ProgressBarModule, SidebarModule, TooltipModule, DropdownModule, InputMaskModule, TagModule, TabViewModule, MultiSelectModule, OverlayPanelModule];

@NgModule({
  declarations: [],
  imports: [CommonModule, ...modulos],
  exports: modulos,
})
export class PrimengModule {}
