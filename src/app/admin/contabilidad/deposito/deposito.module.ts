import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DepositoRoutingModule } from './deposito.routing';
import { DepositoComponent } from './deposito.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PipesModule } from '../../../core/pipe/pipes.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { TablasModule } from '../../components/new_tablas/tablas.module';
import { ImgModule } from '../../components/img-component/img.module';
import { ImgViewerEditModule } from '../../components/img-viewer-edit/img-viewer-edit.module';
import { FormDivisaInputModule } from '../../../core/components/form-fields/form-divisa-input/form-divisa-input.module';

@NgModule({
  declarations: [DepositoComponent],
  imports: [CommonModule, DepositoRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, PipesModule, TablasModule, DirectivesModule, ImgViewerEditModule, ImgModule, NgxPermissionsModule.forChild(), FormDivisaInputModule],
})
export class DepositoModule {}
