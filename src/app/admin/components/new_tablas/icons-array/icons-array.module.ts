import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconsArrayComponent } from './icons-array/icons-array.component';
import { TooltipModule } from 'primeng/tooltip';

const components = [IconsArrayComponent];
@NgModule({
  declarations: components,
  imports: [CommonModule, TooltipModule],
  exports: components,
})
export class IconsArrayModule {}
