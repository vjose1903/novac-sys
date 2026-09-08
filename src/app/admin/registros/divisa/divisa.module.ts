import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DivisaRoutingModule } from './divisa.routing';
import { DivisaComponent } from './divisa.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';

import { TablasModule } from '@components/new_tablas/tablas.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { PipesModule } from '@core/pipe/pipes.module';
import { DirectivesModule } from '@core/directive/directives.module';
import { BtnIconModule } from '@components/btn-icon-circular/btn-icon-circular.module';
import { ImgViewerEditModule } from '@components/img-viewer-edit/img-viewer-edit.module';
import { TasaDeCambioComponent } from './tasa-de-cambio/tasa-de-cambio.component';
import { ImgModule } from '@components/img-component/img.module';

@NgModule({
  declarations: [],
  imports: [CommonModule, DivisaRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, PipesModule, TablasModule, DirectivesModule, NgxPermissionsModule.forChild(), BtnIconModule, ImgViewerEditModule, ImgModule, DivisaComponent, TasaDeCambioComponent],
})
export class DivisaModule {}
