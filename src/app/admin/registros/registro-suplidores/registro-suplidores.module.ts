import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroSuplidoresRoutingModule } from './registro-suplidores.routing';
import { RegistroSuplidoresComponent } from './registro-suplidores.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewTablasModule } from '../../components/new_tablas/tablas.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { NgxPermissionsModule } from 'ngx-permissions';

@NgModule({
  declarations: [RegistroSuplidoresComponent],
  imports: [CommonModule, RegistroSuplidoresRoutingModule, ReactiveFormsModule, FormsModule, NewTablasModule, DirectivesModule, PrimengModule, NgxPermissionsModule.forChild()],
})
export class RegistroSuplidoresModule {}
