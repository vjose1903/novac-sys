import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroVehiculoRoutingModule } from './registro-vehiculo.routing';
import { RegistroVehiculoComponent } from './registro-vehiculo.component';
import { TablasModule } from '../../components/tablas/tablas.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
  declarations: [RegistroVehiculoComponent],
  imports: [
    CommonModule,
    RegistroVehiculoRoutingModule,
    TablasModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    // TODO: quitar el ngSelect de aqui
  ],
})
export class RegistroVehiculoModule {}
