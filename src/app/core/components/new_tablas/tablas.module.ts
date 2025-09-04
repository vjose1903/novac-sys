import { IconsArrayModule } from './icons-array/icons-array.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewTablasComponent } from './tablas.component';
import { ImgModule } from '../img-component/img.module';
import { NewBTNACCIONESComponent } from './btnacciones/btnacciones.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SelectModule } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SpeedDialModule } from 'primeng/speeddial';
import { DirectivesModule } from '@core/directive/directives.module';
import { PipesModule } from '@core/pipe/pipes.module';
import { NgxPermissionsModule } from 'ngx-permissions';
import { PrimengModule } from '../../../modules/primeng.module';

@NgModule({
  declarations: [NewTablasComponent, NewBTNACCIONESComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PipesModule, DirectivesModule, SelectModule, PaginatorModule, TooltipModule, TagModule, SpeedDialModule,  NgxPermissionsModule.forChild(), IconsArrayModule, ImgModule],
  exports: [NewTablasComponent, NewBTNACCIONESComponent],
})
export class TablasModule {}
