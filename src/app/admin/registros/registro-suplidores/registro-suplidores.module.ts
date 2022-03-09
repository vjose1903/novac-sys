import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroSuplidoresRoutingModule } from './registro-suplidores.routing';
import { RegistroSuplidoresComponent } from './registro-suplidores.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablasModule } from '../../components/tablas/tablas.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PrimengModule } from '../../../modules/primeng.module';

@NgModule({
  declarations: [RegistroSuplidoresComponent],
  imports: [CommonModule, RegistroSuplidoresRoutingModule, ReactiveFormsModule, FormsModule, TablasModule, DirectivesModule, PrimengModule],
})
export class RegistroSuplidoresModule {}
