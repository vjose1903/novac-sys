import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransferenciasRoutingModule } from './transferencias.routing';
import { TransferenciasComponent } from './transferencias.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '../../../core/pipe/pipes.module';
import { TablasModule } from '../../components/new_tablas/tablas.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ImgModule } from '../../components/img-component/img.module';
import { ImgViewerEditModule } from '../../components/img-viewer-edit/img-viewer-edit.module';
import { NgxPermissionsModule } from 'ngx-permissions';

@NgModule({
  declarations: [TransferenciasComponent],
  imports: [CommonModule, TransferenciasRoutingModule, FormsModule, ReactiveFormsModule, PipesModule, TablasModule, DirectivesModule, CalendarModule, DropdownModule, ImgModule, ImgViewerEditModule, NgxPermissionsModule.forChild()],
})
export class TransferenciasModule {}
