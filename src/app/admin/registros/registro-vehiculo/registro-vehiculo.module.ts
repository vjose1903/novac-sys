import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroVehiculoRoutingModule } from './registro-vehiculo.routing';
import { RegistroVehiculoComponent } from './registro-vehiculo.component';
import { NewTablasModule } from '../../components/new_tablas/tablas.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPermissionsModule } from 'ngx-permissions';

@NgModule({
  declarations: [RegistroVehiculoComponent],
  imports: [
    CommonModule,
    RegistroVehiculoRoutingModule,
    NewTablasModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    // TODO: quitar el ngSelect de aqui cuando se sustituya el ng select del html
    NgxPermissionsModule.forChild(),
  ],
})
export class RegistroVehiculoModule {}
