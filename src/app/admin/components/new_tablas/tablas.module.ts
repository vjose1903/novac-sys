import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewTablasComponent } from './tablas.component';
import { NewBTNACCIONESComponent } from './btnacciones/btnacciones.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SpeedDialModule } from 'primeng/speeddial';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PipesModule } from '../../../core/pipe/pipes.module';
import { NgxPermissionsModule } from 'ngx-permissions';
import { AngularResizedEventModule } from 'angular-resize-event';

@NgModule({
  declarations: [NewTablasComponent, NewBTNACCIONESComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PipesModule, DirectivesModule, DropdownModule, PaginatorModule, TooltipModule, TagModule, SpeedDialModule, InputSwitchModule, NgxPermissionsModule.forChild(), AngularResizedEventModule],
  exports: [NewTablasComponent, NewBTNACCIONESComponent],
})
export class NewTablasModule {}
