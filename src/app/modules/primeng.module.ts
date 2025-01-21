import { NgModule } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { MultiSelectModule } from 'primeng/multiselect';
import { PopoverModule } from 'primeng/popover';
import { DatePickerModule } from 'primeng/datepicker';

const modulos = [DialogModule, ProgressBarModule, DrawerModule, TooltipModule, SelectModule, InputMaskModule, TagModule, TabsModule, MultiSelectModule, PopoverModule, DatePickerModule];

@NgModule({
  declarations: [],
  imports: [CommonModule, ...modulos],
  exports: modulos,
})
export class PrimengModule {}
