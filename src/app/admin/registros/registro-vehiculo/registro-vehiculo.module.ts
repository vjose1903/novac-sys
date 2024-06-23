import { DirectivesModule } from './../../../core/directive/directives.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroVehiculoRoutingModule } from './registro-vehiculo.routing';
import { RegistroVehiculoComponent } from './registro-vehiculo.component';
import { TablasModule } from '../../components/new_tablas/tablas.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { PrimengModule } from '../../../modules/primeng.module';

@NgModule({
  declarations: [RegistroVehiculoComponent],
  imports: [
    CommonModule,
    RegistroVehiculoRoutingModule,
    TablasModule,
    ReactiveFormsModule,
    FormsModule,
    PrimengModule,
    NgxPermissionsModule.forChild(),
    DirectivesModule,
  ],
})
export class RegistroVehiculoModule {}
